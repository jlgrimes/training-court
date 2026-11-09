import { ReplayRuntime, resolveReplay, type ReplayPass, type ReplayBuildOptions } from './replay-resolution';
import { compileReplaySources, parseReplayOperation, normalizeReplayLine } from './replay-operations';
import { ruleKey, energyRequirement } from './replay-rules';
import { ReplayHandKnowledge } from './hand-knowledge';
import { replayCardIdentifier, matchesReplayCard } from './card-identity';
import { BattleLog, BattleLogAction } from "@/components/battle-logs/utils/battle-log.types";
import { normalizeCardNameForLookup } from '@/lib/ptcg/card-name';
import {
  BattleLogReplay,
  ReplayBoardState,
  ReplayCard,
  ReplayEvent,
  ReplayEventKind,
  ReplayFrame,
  ReplayPlayerState,
  ReplayPokemon,
} from "./battle-log-replay.types";

export const normalizeReplayCardName = (name: string) => {
  const match = name.trim().match(/^\([^)]+\)\s+(.+)$/);
  return match ? match[1].trim() : name.trim();
};

function reconstruct(battleLog: BattleLog, perspectivePlayerName: string | null | undefined, runtime: ReplayRuntime): ReplayPass {
  let nextEntityId = 0;
  const abilityUses = new Set<string>();


  const makeEntityId = (prefix: string, name: string) => {
    nextEntityId += 1;
    return `${prefix}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${nextEntityId}`;
  };

  const normalizeLine = normalizeReplayLine;

  const stripListPrefix = (line: string) =>
    normalizeLine(line).replace(/^[-\s\u2022]+/, '');

  const isCardListLine = (line: string) => {
    const stripped = stripListPrefix(line);
    if (!stripped || stripped.endsWith('.') || stripped.includes(' shuffled ')) return false;
    return stripped.includes(',') || /^[a-z][a-z0-9:'\-. ]+$/.test(normalizeCardNameForLookup(normalizeReplayCardName(stripped)));
  };

  const parseCardList = (line: string): string[] => {
    const stripped = stripListPrefix(line);
    if (!isCardListLine(stripped)) return [];
    return stripped.split(',').map((card) => card.trim()).filter(Boolean);
  };

  const makeCard = (name: string, known = true): ReplayCard => ({
    id: makeEntityId(known ? 'known' : 'unknown', name),
    name: normalizeReplayCardName(name),
    identifier: replayCardIdentifier(name),
    known,
  });

  const makePokemon = (name: string, card = makeCard(name)): ReplayPokemon => ({
    id: card.id,
    stack: [card],
    name: normalizeReplayCardName(name),
    identifier: replayCardIdentifier(name),
    damage: 0,
    attachments: [],
    status: [],
  });

  const cloneBoard = (board: ReplayBoardState): ReplayBoardState => ({
    playerOrder: [...board.playerOrder],
    stadium: board.stadium ? { ...board.stadium } : null,
    players: Object.fromEntries(
      Object.entries(board.players).map(([name, player]) => [
        name,
        {
          ...player,
          hand: {
            knownCards: player.hand.knownCards.map((card) => ({ ...card })),
            unknownCount: player.hand.unknownCount,
          },
          discard: player.discard.map((card) => ({ ...card })),
          lostZone: player.lostZone?.map((card) => ({ ...card })),
          returnedToDeck: player.returnedToDeck?.map((card) => ({ ...card })),
          active: player.active
            ? { ...player.active, stack: player.active.stack?.map((card) => ({ ...card })), attachments: player.active.attachments.map((card) => ({ ...card })), status: [...player.active.status] }
            : null,
          bench: player.bench.map((pokemon) => ({
            ...pokemon,
            stack: pokemon.stack?.map((card) => ({ ...card })),
            attachments: pokemon.attachments.map((card) => ({ ...card })),
            status: [...pokemon.status],
          })),
        },
      ])
    ),
  });

  const createInitialBoard = (players: string[]): ReplayBoardState => ({
    playerOrder: players,
    stadium: null,
    players: Object.fromEntries(
      players.map((name) => [
        name,
        {
          name,
          active: null,
          bench: [],
          hand: { knownCards: [], unknownCount: 0 },
          discard: [],
          prizesRemaining: 6,
        } satisfies ReplayPlayerState,
      ])
    ),
  });

  const findPlayer = (line: string, players: string[]) =>
    [...players].sort((a, b) => b.length - a.length).find((player) => {
      const text = stripListPrefix(line).toLowerCase();
      const name = player.toLowerCase();
      return text.startsWith(`${name} `) || text.startsWith(`${name}'s `) || text.endsWith(`to ${name}'s hand.`);
    });

  const addKnownCardsToHand = (player: ReplayPlayerState, cardNames: string[]) => {
    player.hand.knownCards.push(...cardNames.map((name) => makeCard(name)));
  };

  const addUnknownCardsToHand = (player: ReplayPlayerState, count: number, knowledge: ReplayHandKnowledge) => {
    knowledge.addUnknown(player, count);
  };

  const removeCardFromHand = (player: ReplayPlayerState, cardName: string, knowledge: ReplayHandKnowledge) => {
    const idx = player.hand.knownCards.findIndex((card) => matchesReplayCard(card, cardName));
    if (idx >= 0) return player.hand.knownCards.splice(idx, 1)[0];
    const hidden = knowledge.removeUnknown(player, cardName);
    if (!hidden) runtime.report('unobserved-card-source');
    return hidden ?? makeCard(cardName);
  };

  const discardCard = (player: ReplayPlayerState, cardName: string, knowledge: ReplayHandKnowledge) => {
    player.discard.push(removeCardFromHand(player, cardName, knowledge));
  };

  const pokemonCandidates = (player: ReplayPlayerState, name: string) =>
    [...(player.active ? [player.active] : []), ...player.bench].filter((pokemon) => matchesReplayCard(pokemon, name));
  const findPokemon = (player: ReplayPlayerState, name: string, eligible: (pokemon: ReplayPokemon) => boolean = () => true) =>
    runtime.pick(pokemonCandidates(player, name).filter(eligible), 'pokemon');
  const findPokemonInZone = (player: ReplayPlayerState, name: string, zone: string) =>
    findPokemon(player, name, (pokemon) => zone === 'in the Active Spot' ? pokemon === player.active : pokemon !== player.active);

  // Split at a known player's possessive, not at a possessive inside a card name.
  const pokemonReference = (board: ReplayBoardState, reference: string) => {
    const owner = [...board.playerOrder].sort((a, b) => b.length - a.length).find((name) => reference.startsWith(`${name}'s `));
    return owner ? { player: board.players[owner], name: reference.slice(owner.length + 3) } : null;
  };

  type ActionContext = {
    existingPokemonIds: Set<string>;
    ruinsTargets: Set<string>;
    retreatedId?: string;
    knockoutDiscards: Array<{ player: string; name: string; cards: ReplayCard[] }>;
  };

  const detachPokemon = (player: ReplayPlayerState, pokemon: ReplayPokemon) => {
    if (player.active?.id === pokemon.id) player.active = null;
    else player.bench = player.bench.filter((card) => card.id !== pokemon.id);
    return pokemon;
  };
  const removePokemonFromBoard = (player: ReplayPlayerState, name: string) => {
    const candidates = pokemonCandidates(player, name);
    return candidates.length ? detachPokemon(player, runtime.pick(candidates, 'remove')!) : null;
  };
  const setActivePokemon = (player: ReplayPlayerState, name: string, context: ActionContext) => {
    if (player.active && matchesReplayCard(player.active, name) && !context.retreatedId) return;
    const candidates = player.bench.filter((pokemon) => matchesReplayCard(pokemon, name) && pokemon.id !== context.retreatedId);
    const existing = runtime.pick(candidates, 'promotion');
    if (!existing) return;
    detachPokemon(player, existing);
    if (player.active) { player.active.status = []; player.bench.push(player.active); }
    existing.status = [];
    player.active = existing;
  };

  const playPokemon = (player: ReplayPlayerState, pokemonName: string, zone: 'active' | 'bench', knowledge: ReplayHandKnowledge) => {
    const card = removeCardFromHand(player, pokemonName, knowledge);
    const pokemon = makePokemon(pokemonName, card);
    if (zone === 'active') {
      if (player.active) player.bench.push(player.active);
      player.active = pokemon;
    } else {
      player.bench.push(pokemon);
    }
  };

  type AttachmentSource = 'hand' | 'deck' | 'discard';
  const attachCardToPokemon = (player: ReplayPlayerState, cardName: string, pokemonName: string, zone: string, source: AttachmentSource, knowledge: ReplayHandKnowledge, context: ActionContext) => {
    const target = findPokemonInZone(player, pokemonName, zone);
    if (!target) return;
    const discardIndex = source === 'discard' ? player.discard.findIndex((card) => matchesReplayCard(card, cardName)) : -1;
    const card = source === 'hand' ? removeCardFromHand(player, cardName, knowledge)
      : discardIndex >= 0 ? player.discard.splice(discardIndex, 1)[0] : makeCard(cardName);
    if (source === 'discard' && discardIndex < 0) runtime.report('missing-discard-source', 'error');
    if (source !== 'hand') runtime.inferred();
    target.attachments.push(card);
  };

  const discardAttachedCard = (player: ReplayPlayerState, cardName: string, pokemonName: string) => {
    const pokemon = findPokemon(player, pokemonName, (pokemon) => pokemon.attachments.some((card) => matchesReplayCard(card, cardName)));
    if (!pokemon) { runtime.report('missing-attachment', 'error'); return; }
    const idx = pokemon.attachments.findIndex((card) => matchesReplayCard(card, cardName));
    player.discard.push(idx >= 0 ? pokemon.attachments.splice(idx, 1)[0] : makeCard(cardName));
  };

  const getActionLines = (action: BattleLogAction) => [action.title, ...action.details].map(normalizeLine);

  const getFollowingCardList = (lines: string[], index: number) => parseCardList(lines[index + 1] ?? '');

  /** Live can print mulligan bonus draws before starting Pokemon placements. */
  const orderSetupActions = (actions: BattleLogAction[], players: string[]): BattleLogAction[] => {
    const placed = new Set(actions.flatMap((action) => getActionLines(action).flatMap((line) => {
      const match = line.match(/^(.+) played .+ to the Active Spot\.$/);
      return match ? [match[1]] : [];
    })));
    if (!players.every((player) => placed.has(player))) return actions;

    const setup: BattleLogAction[] = [];
    const bonuses: BattleLogAction[] = [];
    actions.forEach((action) => {
      const lines = getActionLines(action);
      const retained: string[] = [];
      for (let index = 0; index < lines.length; index++) {
        const bonus = lines[index].match(/^(.+) drew (\d+) more cards? because .+ took at least 1 mulligan\.$/);
        if (!bonus) {
          retained.push(lines[index]);
          continue;
        }
        const title = lines[index];
        const details: string[] = [];
        const draw = lines[index + 1]?.match(/^-? ?(.+) drew (\d+) cards?\.$/);
        if (draw && draw[1] === bonus[1] && draw[2] === bonus[2]) {
          details.push(lines[++index]);
        } else {
          // Some log formats report the bonus only in the summary line.
          details.push(`${bonus[1]} drew ${bonus[2]} cards.`);
        }
        if (parseCardList(lines[index + 1] ?? '').length > 0) details.push(lines[++index]);
        bonuses.push({ title, details });
      }
      if (retained.length > 0) setup.push({ title: retained[0], details: retained.slice(1) });
    });
    return [...setup, ...bonuses];
  };

  const classifyEvent = (line: string): ReplayEventKind => {
    if (line.includes(' drew ') || (line.includes(' was added to ') && line.includes("'s hand"))) return 'draw';
    if (line.includes(' attached ')) return 'attach';
    if (line.includes(' evolved ')) return 'evolve';
    if (line.includes(' is now in the Active Spot') || line.includes(' was switched with ')) return 'switch';
    if (line.includes(' used ') && line.includes(' damage')) return 'attack';
    if (line.includes(' damage counter') || (line.includes(' took ') && line.includes(' damage'))) return 'damage';
    if (line.includes(' healed ')) return 'heal';
    if (line.includes(' discarded') || line.includes(' was discarded from')) return 'discard';
    if (line.includes(' Prize card')) return 'prize';
    if (line.includes(' played ')) return 'play';
    return 'text';
  };

  const mutateLine = (board: ReplayBoardState, rawLine: string, players: string[], lines: string[], index: number, stadiumDiscards: Set<string>, knowledge: ReplayHandKnowledge, context: ActionContext) => {
    const line = normalizeLine(rawLine);
    const operation = runtime.operation;
    const playerName = findPlayer(line, players);
    const player = playerName ? board.players[playerName] : null;

    if (operation.kind === 'unsupported') { runtime.report('unsupported-event'); return; }
    if (operation.kind === 'observation') {
      if (line.includes('ended their turn') && Object.values(board.players).some((owner) =>
        owner.active?.status.some((condition) => ['Poisoned', 'Burned', 'Asleep', 'Paralyzed'].includes(condition)))) {
        runtime.report('unsupported-condition-timing');
      }
      return;
    }
    if (['cardList', 'discardSummary'].includes(operation.kind)) return;
    const operands = operation.operands;
    if (operation.kind === 'retreatedMatch') {
      const owner = board.players[operands[0]];
      if (owner?.active && matchesReplayCard(owner.active, operands[1])) {
        context.retreatedId = owner.active.id;
        // Promotion is grouped into this action. Defer the move until its line,
        // allowing retreat costs to be removed from the outgoing Active copy.
        owner.active.status = [];
      } else runtime.report('missing-retreating-pokemon', 'error');
      return;
    }
    if (operation.kind === 'abilityMatch') {
      const owner = board.players[operands[0]];
      if (!owner) { runtime.report('missing-player', 'error'); return; }
      const candidates = pokemonCandidates(owner, operands[1]);
      const rule = runtime.rules.abilities[ruleKey(normalizeReplayCardName(operands[1]), operands[2])];
      if (!rule) { runtime.report('unsupported-ability-rule'); return; }
      if (!candidates.length) { runtime.report('missing-ability-user', 'error'); return; }
      const eligible = candidates.filter((pokemon) => energyRequirement(pokemon, [rule.energy], runtime.rules, board) !== 'no'
        && (!rule.oncePerTurn || !abilityUses.has(`${pokemon.id}:${operands[2]}`)));
      if (!runtime.require(eligible.length > 0, 'ability-requirement')) return;
      const user = runtime.pick(eligible, 'ability-user')!;
      if (energyRequirement(user, [rule.energy], runtime.rules, board) === 'unknown') runtime.report('unsupported-energy-rule');
      abilityUses.add(`${user.id}:${operands[2]}`);
      return;
    }
    if (operation.kind === 'statusMatch' || operation.kind === 'statusClearedMatch') {
      const reference = pokemonReference(board, operands[0]);
      const target = reference ? findPokemon(reference.player, reference.name) : undefined;
      if (target) {
        const status = operands[1];
        if (operation.kind === 'statusClearedMatch') target.status = target.status.filter((item) => item !== status);
        else {
          if (['Asleep', 'Paralyzed', 'Confused'].includes(status)) target.status = target.status.filter((item) => !['Asleep', 'Paralyzed', 'Confused'].includes(item));
          target.status = Array.from(new Set([...target.status, status]));
        }
      }
      return;
    }
    if (operation.kind === 'returnedPokemonMatch') {
      const owner = board.players[operands[0]];
      const target = owner ? removePokemonFromBoard(owner, operands[1]) : null;
      if (owner && target) {
        owner.hand.knownCards.push(...(target.stack ?? [{ id: target.id, name: target.name, identifier: target.identifier, known: true }]));
        owner.discard.push(...target.attachments);
      }
      return;
    }
    if (operation.kind === 'lostZoneMatch') {
      const owner = board.players[operands[0]];
      runtime.report('unsupported-lost-zone-source');
      if (owner) (owner.lostZone ??= []).push(removeCardFromHand(owner, operands[1], knowledge));
      return;
    }

    const mulliganMatch = operation.kind === 'mulliganMatch' ? [line, ...operation.operands] : null;
    if (mulliganMatch) {
      const owner = board.players[mulliganMatch[1]];
      // Revealed mulligan cards were returned, and the replacement hand is hidden.
      if (owner) knowledge.reset(owner, 7);
      return;
    }

    const shuffledMatch = operation.kind === 'shuffledMatch' ? [line, ...operation.operands] : null;
    if (shuffledMatch) {
      const owner = board.players[shuffledMatch[1]];
      if (!owner) return;
      const listed = getFollowingCardList(lines, index);
      if (listed.length > 0) {
        const effect = lines[0]?.match(/^.+ played (.+)\.$/)?.[1];
        const source = effect ? runtime.rules.shuffleSources?.[normalizeCardNameForLookup(normalizeReplayCardName(effect))] : undefined;
        const returnedCards: ReplayCard[] = [];
        const alreadyReturned = new Map<string, number>();
        listed.forEach((name) => {
          const key = replayCardIdentifier(name) ?? normalizeReplayCardName(name);
          if ((alreadyReturned.get(key) ?? 0) > 0) { alreadyReturned.set(key, alreadyReturned.get(key)! - 1); return; }
          const boardCandidates = pokemonCandidates(owner, name);
          let chosen: ReplayPokemon | undefined;
          if (source !== 'hand' && boardCandidates.length) {
            if (source === 'board') chosen = runtime.pick(boardCandidates, 'shuffle-pokemon');
            else {
              runtime.report('unsupported-shuffle-source');
              const candidates: Array<{ id: string; pokemon?: ReplayPokemon }> = boardCandidates.map((pokemon) => ({ id: pokemon.id, pokemon }));
              if (owner.hand.unknownCount > 0 || owner.hand.knownCards.some((card) => matchesReplayCard(card, name))) candidates.push({ id: `hand:${owner.name}` });
              chosen = runtime.pick(candidates, 'shuffle-origin')?.pokemon;
            }
          }
          const fromBoard = !!chosen;
          if (fromBoard) {
            const pokemon = detachPokemon(owner, chosen!);
            const cards = [...(pokemon.stack ?? [{ id: pokemon.id, name: pokemon.name, identifier: pokemon.identifier, known: true }]), ...pokemon.attachments];
            returnedCards.push(...cards);
            cards.forEach((card) => {
              const cardKey = card.identifier ?? card.name;
              alreadyReturned.set(cardKey, (alreadyReturned.get(cardKey) ?? 0) + 1);
            });
            alreadyReturned.set(key, alreadyReturned.get(key)! - 1);
          } else returnedCards.push(removeCardFromHand(owner, name, knowledge));
        });
        // A return ledger records the observed movement, not a claim about deck order.
        (owner.returnedToDeck ??= []).push(...returnedCards);
      } else {
        const count = shuffledMatch[2] === 'a card' ? 1 : parseInt(shuffledMatch[2], 10);
        const remaining = Math.max(0, owner.hand.knownCards.length + owner.hand.unknownCount - count);
        // Without a list we cannot know which identities remain in hand.
        knowledge.reset(owner, remaining);
      }
      return;
    }

    const openingHandMatch = operation.kind === 'openingHandMatch' ? [line, ...operation.operands] : null;
    if (openingHandMatch) {
      const actingPlayer = board.players[openingHandMatch[1]];
      if (actingPlayer) {
        const listIndex = lines[index + 1]?.includes('drawn cards') ? index + 1 : index;
        const listedCards = getFollowingCardList(lines, listIndex);
        listedCards.length > 0 ? addKnownCardsToHand(actingPlayer, listedCards) : addUnknownCardsToHand(actingPlayer, 7, knowledge);
      }
      return;
    }

    const addedKnownCardMatch = operation.kind === 'addedKnownCardMatch' ? [line, ...operation.operands] : null;
    if (addedKnownCardMatch) {
      const owner = board.players[addedKnownCardMatch[2]];
      if (owner) addKnownCardsToHand(owner, [addedKnownCardMatch[1]]);
      return;
    }

    const genericAddedMatch = operation.kind === 'genericAddedMatch' ? [line, ...operation.operands] : null;
    if (genericAddedMatch) {
      const owner = board.players[genericAddedMatch[1]];
      if (owner) addUnknownCardsToHand(owner, 1, knowledge);
      return;
    }

    const drewToBenchMatch = operation.kind === 'drewToBenchMatch' ? [line, ...operation.operands] : null;
    if (drewToBenchMatch) {
      const owner = board.players[drewToBenchMatch[1]];
      // These cards come directly from the deck, so the hand is unchanged.
      if (owner) owner.bench.push(makePokemon(drewToBenchMatch[2]));
      return;
    }

    const drewNamedMatch = operation.kind === 'drewNamedMatch' ? [line, ...operation.operands] : null;
    if (drewNamedMatch && !line.includes(' drew a card') && !line.match(/drew \d+ cards/)) {
      const owner = board.players[drewNamedMatch[1]];
      if (owner) addKnownCardsToHand(owner, [drewNamedMatch[2]]);
      return;
    }

    const drewCountMatch = operation.kind === 'drewCountMatch' ? [line, ...operation.operands] : null;
    if (drewCountMatch) {
      const owner = board.players[drewCountMatch[1]];
      if (owner) {
        const cardNames = getFollowingCardList(lines, index);
        if (line.includes('played them to the Bench')) owner.bench.push(...cardNames.map((name) => makePokemon(name)));
        else if (cardNames.length > 0) addKnownCardsToHand(owner, cardNames);
        else addUnknownCardsToHand(owner, Number(drewCountMatch[2]), knowledge);
      }
      return;
    }

    const drewSingleUnknownMatch = operation.kind === 'drewSingleUnknownMatch' ? [line, ...operation.operands] : null;
    if (drewSingleUnknownMatch) {
      const owner = board.players[drewSingleUnknownMatch[1]];
      if (owner) addUnknownCardsToHand(owner, 1, knowledge);
      return;
    }

    const playedPokemonMatch = operation.kind === 'playedPokemonMatch' ? [line, ...operation.operands] : null;
    if (playedPokemonMatch) {
      const owner = board.players[playedPokemonMatch[1]];
      if (owner) playPokemon(owner, playedPokemonMatch[2], playedPokemonMatch[3] === 'Active Spot' ? 'active' : 'bench', knowledge);
      return;
    }

    const activeSpotMatch = operation.kind === 'activeSpotMatch' ? [line, ...operation.operands] : null;
    if (activeSpotMatch) {
      const reference = pokemonReference(board, activeSpotMatch[1]);
      if (reference) setActivePokemon(reference.player, reference.name, context);
      else runtime.report('missing-player', 'error');
      return;
    }

    const attachedMatch = operation.kind === 'attachedMatch' ? [line, ...operation.operands] : null;
    if (attachedMatch) {
      const owner = board.players[attachedMatch[1]];
      const targetName = attachedMatch[3].startsWith(`${owner?.name}'s `)
        ? attachedMatch[3].slice(owner.name.length + 3)
        : attachedMatch[3];
      const playedCard = lines[0]?.match(/^.+ played (.+)\.$/)?.[1];
      const effect = playedCard ? normalizeCardNameForLookup(normalizeReplayCardName(playedCard)) : '';
      let source: AttachmentSource = runtime.rules.attachmentSources[effect] ?? 'hand';
      if (effect && !runtime.rules.attachmentSources[effect]) {
        runtime.report('unsupported-attachment-source');
        source = runtime.pick([{ id: 'hand' as const }, { id: 'deck' as const }, { id: 'discard' as const }], 'attachment-source')!.id;
      }
      if (owner) attachCardToPokemon(owner, attachedMatch[2], targetName, attachedMatch[4], source, knowledge, context);
      return;
    }

    const evolvedMatch = operation.kind === 'evolvedMatch' ? [line, ...operation.operands] : null;
    if (evolvedMatch) {
      const owner = board.players[evolvedMatch[1]];
      const pokemon = owner ? findPokemonInZone(owner, evolvedMatch[2], evolvedMatch[4]) : null;
      if (owner && pokemon) {
        const evolvedCard = removeCardFromHand(owner, evolvedMatch[3], knowledge);
        pokemon.stack ??= [{ id: pokemon.id, name: pokemon.name, identifier: pokemon.identifier, known: true }];
        pokemon.stack.push(evolvedCard);
        pokemon.status = [];
        pokemon.name = normalizeReplayCardName(evolvedMatch[3]);
        pokemon.identifier = evolvedCard.identifier;
      }
      return;
    }

    const stadiumMatch = operation.kind === 'stadiumMatch' ? [line, ...operation.operands] : null;
    if (stadiumMatch) {
      const owner = board.players[stadiumMatch[1]];
      if (owner) {
        const previous = board.stadium;
        if (previous?.owner && board.players[previous.owner]) {
          board.players[previous.owner].discard.push(previous);
          stadiumDiscards.add(`${previous.owner}:${previous.identifier ?? previous.name}`);
        }
        board.stadium = { ...removeCardFromHand(owner, stadiumMatch[2], knowledge), owner: owner.name };
      }
      return;
    }

    const discardedStadiumMatch = operation.kind === 'discardedStadiumMatch' ? [line, ...operation.operands] : null;
    if (discardedStadiumMatch) {
      if (board.stadium && matchesReplayCard(board.stadium, discardedStadiumMatch[1])) {
        const stadium = board.stadium;
        if (stadium.owner && board.players[stadium.owner]) board.players[stadium.owner].discard.push(stadium);
        board.stadium = null;
      }
      return;
    }

    const playedCardMatch = operation.kind === 'playedCardMatch' ? [line, ...operation.operands] : null;
    if (playedCardMatch && player) {
      // Logs can say "played" when activating a Stadium or an in-play Pokemon.
      // Actual Pokemon plays have already matched the explicit board-zone form.
      if (board.stadium && matchesReplayCard(board.stadium, playedCardMatch[2])) return;
      if (pokemonCandidates(player, playedCardMatch[2]).length) return;
      player.discard.push(removeCardFromHand(player, playedCardMatch[2], knowledge));
      return;
    }

    const discardedListMatch = operation.kind === 'discardedListMatch' ? [line, ...operation.operands] : null;
    if (discardedListMatch) {
      const owner = board.players[discardedListMatch[1]];
      const cardNames = getFollowingCardList(lines, index);
      if (owner && cardNames.length > 0) cardNames.forEach((cardName) => discardCard(owner, cardName, knowledge));
      return;
    }

    const discardedNamedMatch = operation.kind === 'discardedNamedMatch' ? [line, ...operation.operands] : null;
    if (discardedNamedMatch) {
      const owner = board.players[discardedNamedMatch[1]];
      const key = `${discardedNamedMatch[1]}:${replayCardIdentifier(discardedNamedMatch[2]) ?? discardedNamedMatch[2]}`;
      if (stadiumDiscards.delete(key)) return;
      if (board.stadium && matchesReplayCard(board.stadium, discardedNamedMatch[2]) && board.stadium.owner === owner?.name) {
        owner.discard.push(board.stadium);
        board.stadium = null;
        return;
      }
      if (owner) {
        discardCard(owner, discardedNamedMatch[2], knowledge);
        return;
      }
    }

    const discardedFromMatch = operation.kind === 'discardedFromMatch' ? [line, ...operation.operands] : null;
    if (discardedFromMatch) {
      const reference = pokemonReference(board, discardedFromMatch[2]);
      const owner = reference?.player;
      if (owner) {
        const knockout = context.knockoutDiscards.find((entry) => entry.player === owner.name && entry.name === reference!.name);
        if (knockout) runtime.require(knockout.cards.some((card) => matchesReplayCard(card, discardedFromMatch[1])), 'knockout-discard-mismatch');
        else discardAttachedCard(owner, discardedFromMatch[1], reference!.name);
      } else runtime.report('missing-player', 'error');
      return;
    }

    const movedToDiscardMatch = operation.kind === 'movedToDiscardMatch' ? [line, ...operation.operands] : null;
    if (movedToDiscardMatch) {
      const owner = board.players[movedToDiscardMatch[2]];
      if (owner) discardCard(owner, movedToDiscardMatch[3], knowledge);
      return;
    }

    const movedToHandMatch = operation.kind === 'movedToHandMatch' ? [line, ...operation.operands] : null;
    if (movedToHandMatch) {
      const owner = board.players[movedToHandMatch[2]];
      if (owner) {
        const discardIndex = owner.discard.findIndex((card) => matchesReplayCard(card, movedToHandMatch[3]));
        const card = discardIndex >= 0 ? owner.discard.splice(discardIndex, 1)[0] : makeCard(movedToHandMatch[3]);
        owner.hand.knownCards.push(card);
      }
      return;
    }

    const attackMatch = operation.kind === 'attackMatch' ? [line, ...operation.operands] : null;
    if (attackMatch) {
      const attack = line.match(/^(.+?) used (.+?) on /);
      const attacker = attack ? pokemonReference(board, attack[1]) : null;
      const active = attacker?.player.active;
      const rule = attacker && attack ? runtime.rules.attacks[ruleKey(normalizeReplayCardName(attacker.name), attack[2])] : undefined;
      if (attacker && active && matchesReplayCard(active, attacker.name)) {
        if (rule) {
          const requirement = energyRequirement(active, rule.cost, runtime.rules, board);
          runtime.require(requirement !== 'no', 'attack-requirement', [active.id]);
          if (requirement === 'unknown') runtime.report('unsupported-energy-rule');
        } else runtime.report('unsupported-attack-rule');
      } else if (attacker && pokemonCandidates(attacker.player, attacker.name).length) {
        runtime.require(false, 'attacker-not-active');
      } else runtime.report('missing-attacker', 'error');
      const reference = pokemonReference(board, attackMatch[1]);
      const target = reference ? findPokemon(reference.player, reference.name, (pokemon) => !rule || pokemon === reference.player.active) : null;
      if (target) target.damage += Number(attackMatch[2]) + Number(attackMatch[3] ?? 0);
      return;
    }

    const movedCounters = operation.kind === 'movedCounters' ? [line, ...operation.operands] : null;
    if (movedCounters) {
      const ability = lines[0]?.match(/^(.+?) used (.+)\.$/);
      const abilityReference = ability ? pokemonReference(board, ability[1]) : null;
      const abilityRule = abilityReference && ability ? runtime.rules.abilities[ruleKey(normalizeReplayCardName(abilityReference.name), ability[2])] : undefined;
      const adrenaBrain = abilityRule?.transferToOpponent && abilityReference ? [ability![0], abilityReference.player.name] : null;
      const sourceReference = pokemonReference(board, movedCounters[2]);
      const targetReference = pokemonReference(board, movedCounters[3]);
      const sourceOwner = adrenaBrain ? board.players[adrenaBrain[1]] : sourceReference?.player;
      // Live can label both ends with the ability user's name. Adrena-Brain
      // transfers from the user's side to the opponent, even for identical printings.
      const targetOwnerName = adrenaBrain
        ? players.find((name) => name !== adrenaBrain[1])
        : targetReference?.player.name;
      const targetOwner = targetOwnerName ? board.players[targetOwnerName] : null;
      const count = movedCounters[1] === 'a' ? 1 : Number(movedCounters[1]);
      const amount = count * 10;
      // A printing identifies a card, not an individual copy. An undamaged copy
      // cannot be the source of a transfer when another matching copy has damage.
      const possibleSources = sourceOwner && sourceReference ? pokemonCandidates(sourceOwner, sourceReference.name) : [];
      if (possibleSources.length && !runtime.require(possibleSources.some((pokemon) => pokemon.damage >= amount), 'insufficient-damage')) return;
      const source = sourceOwner && sourceReference ? findPokemon(sourceOwner, sourceReference.name, (pokemon) => pokemon.damage >= amount) : null;
      const target = targetOwner && targetReference ? findPokemon(targetOwner, targetReference.name) : null;
      if (source && target && source !== target) {
        if (runtime.require(source.damage >= amount, 'insufficient-damage', [source.id])) {
          source.damage -= amount;
          target.damage += amount;
        }
      }
      return;
    }

    const placedCounters = operation.kind === 'placedCounters' ? [line, ...operation.operands] : null;
    if (placedCounters) {
      const reference = pokemonReference(board, placedCounters[2]);
      const riskyRuins = lines.slice(0, index).includes('Risky Ruins was activated.');
      const attack = lines[0]?.match(/^(.+?) used (.+?) on (.+) for \d+ damage\./);
      const attackUser = attack ? pokemonReference(board, attack[1]) : null;
      const spreadRule = attackUser && attack ? runtime.rules.attacks[ruleKey(normalizeReplayCardName(attackUser.name), attack[2])] : undefined;
      const phantomDive = spreadRule?.benchCounters && attack ? [attack[0], attack[3]] : null;
      // Stadium counters belong to the copy just benched in this action, even
      // when Live prints an incorrect owner or another copy is already in play.
      const newCandidates = riskyRuins && reference
        ? Object.values(board.players).flatMap((owner) => owner.bench).filter((pokemon) =>
          !context.existingPokemonIds.has(pokemon.id) && !context.ruinsTargets.has(pokemon.id)
          && matchesReplayCard(pokemon, reference.name))
        : [];
      const newlyBenched = newCandidates.length ? runtime.pick(newCandidates, 'stadium-target') : null;
      const defendingPlayer = phantomDive ? pokemonReference(board, phantomDive[1])?.player : null;
      const spreadCandidates = defendingPlayer && reference
        ? defendingPlayer.bench.filter((pokemon) => matchesReplayCard(pokemon, reference.name)) : [];
      // A covered spread attack constrains the side and zone. Repeated printing
      // identifiers still permit either the same or different physical copies.
      const spreadTarget = phantomDive && !riskyRuins ? runtime.pick(spreadCandidates, 'spread-target') : null;
      const target = newlyBenched ?? (phantomDive && !riskyRuins
        ? spreadTarget : reference ? findPokemon(reference.player, reference.name) : null);
      const count = placedCounters[1] === 'a' ? 1 : Number(placedCounters[1]);
      if (target) {
        if ((riskyRuins || phantomDive) && reference?.player.name !== (defendingPlayer?.name ?? playerName)) runtime.inferred();
        target.damage += count * 10;
        if (riskyRuins) context.ruinsTargets.add(target.id);
      }
      return;
    }

    const damageCounterMatch = operation.kind === 'damageCounterMatch' ? [line, ...operation.operands] : null;
    if (damageCounterMatch) {
      const reference = pokemonReference(board, damageCounterMatch[2]);
      const target = reference ? findPokemon(reference.player, reference.name) : null;
      if (target) target.damage += Number(damageCounterMatch[1]) * 10;
      return;
    }

    const healedMatch = operation.kind === 'healedMatch' ? [line, ...operation.operands] : null;
    if (healedMatch) {
      const reference = pokemonReference(board, healedMatch[1]);
      const target = reference ? findPokemon(reference.player, reference.name, (pokemon) => pokemon.damage > 0) : null;
      if (target) target.damage = Math.max(0, target.damage - Number(healedMatch[2]));
      return;
    }

    const knockedOutMatch = operation.kind === 'knockedOutMatch' ? [line, ...operation.operands] : null;
    if (knockedOutMatch) {
      const reference = pokemonReference(board, knockedOutMatch[1]);
      const owner = reference?.player;
      const pokemon = owner ? removePokemonFromBoard(owner, reference!.name) : null;
      if (owner && pokemon) {
        const cards = [...(pokemon.stack ?? [{ id: pokemon.id, name: pokemon.name, identifier: pokemon.identifier, known: true }]), ...pokemon.attachments];
        owner.discard.push(...cards);
        context.knockoutDiscards.push({ player: owner.name, name: reference!.name, cards });
      }
      return;
    }

    const prizesMatch = operation.kind === 'prizesMatch' ? [line, ...operation.operands] : null;
    if (prizesMatch) {
      const owner = board.players[prizesMatch[1]];
      const prizeCount = prizesMatch[2] === 'a' ? 1 : Number(prizesMatch[2]);
      if (owner) {
        runtime.require(owner.prizesRemaining >= prizeCount, 'invalid-prize-count');
        owner.prizesRemaining = Math.max(0, owner.prizesRemaining - prizeCount);
      }
    }
  };

  const buildEvent = (id: string, action: BattleLogAction, lines: string[], players: string[]): ReplayEvent => {
    const title = normalizeLine(action.title);
    const cardNames = lines.flatMap((line) => parseCardList(line)).filter((name) => !name.match(/^\d+ drawn cards\.?$/));
    const player = findPlayer(title, players);
    const attackMatch = title.match(/^(.+)'s (.+) used (.+) on (.+)'s (.+) for (\d+) damage/);

    return {
      id,
      kind: classifyEvent(title),
      title,
      details: action.details.map(normalizeLine),
      player,
      cards: cardNames.map((name) => makeCard(name)),
      damage: attackMatch ? Number(attackMatch[6]) : undefined,
      targetName: attackMatch ? attackMatch[5] : undefined,
    };
  };

  function buildPass(): BattleLogReplay {
    nextEntityId = 0;
    const players = battleLog.players.map((player) => player.name);
    const perspectivePlayer = players.find((player) => player.toLowerCase() === perspectivePlayerName?.toLowerCase()) ?? players[0];
    const knowledge = new ReplayHandKnowledge(perspectivePlayer, makeCard);
    const board = createInitialBoard(players);
    const frames: ReplayFrame[] = [];
    const sourceOperations = compileReplaySources(battleLog);
    let currentOperations: import('./battle-log-replay.types').ReplayOperation[] = [];
    const mulligans: Record<string, number> = {};
    battleLog.sections[0]?.actions.forEach((action) => {
      getActionLines(action).forEach((line) => {
        const match = line.match(/^(.+) took (a|\d+) mulligans?\.$/);
        if (match && players.includes(match[1])) {
          // Live can report an intermediate count followed by the final total.
          mulligans[match[1]] = Math.max(mulligans[match[1]] ?? 0, match[2] === 'a' ? 1 : Number(match[2]));
        }
      });
    });

    const pushFrame = (sectionIndex: number, actionIndex: number | null, turnTitle: string, currentPlayer: string, event: ReplayEvent) => {
      runtime.validate(board);
      const snapshot = cloneBoard(board);
      const observedHands = Object.fromEntries(Object.entries(snapshot.players).map(([name, player]) => [name, {
        knownCards: player.hand.knownCards.map((card) => ({ ...card })), unknownCount: player.hand.unknownCount,
      }]));
      Object.values(board.players).forEach((player) => knowledge.captureFrame(player, snapshot.players[player.name]));
      frames.push({
        id: `frame-${frames.length}`,
        index: frames.length,
        sectionIndex,
        actionIndex,
        turnTitle,
        currentPlayer,
        board: snapshot,
        event,
        operations: currentOperations,
        observedHands,
      });
    };

    battleLog.sections.forEach((section, sectionIndex) => {
      abilityUses.clear();
      const actions = sectionIndex === 0 ? orderSetupActions(section.actions, players) : section.actions;
      actions.forEach((action, actionIndex) => {
        const lines = getActionLines(action);
        const originalIndex = section.actions.indexOf(action);
        const originals = originalIndex >= 0 ? sourceOperations[sectionIndex][originalIndex] : sourceOperations[sectionIndex].flat();
        const assignedSources = new Set<string>();
        currentOperations = lines.map((line, lineIndex) => {
          const found = originalIndex >= 0 ? originals[lineIndex]
            : originals.find((operation) => !assignedSources.has(operation.id) && normalizeReplayLine(operation.source.raw) === line);
          if (found) assignedSources.add(found.id);
          return found
          ?? parseReplayOperation(line, { sectionIndex, actionIndex, detailIndex: lineIndex === 0 ? null : lineIndex - 1, raw: [action.title, ...action.details][lineIndex] });
        });
        const stadiumDiscards = new Set<string>();
        const context: ActionContext = {
          existingPokemonIds: new Set(Object.values(board.players).flatMap((player) =>
            [...(player.active ? [player.active] : []), ...player.bench].map((pokemon) => pokemon.id))),
          ruinsTargets: new Set(),
          knockoutDiscards: [],
        };
        lines.forEach((line, lineIndex) => {
          runtime.enter(currentOperations[lineIndex], frames.length);
          if (battleLog.language === 'en') mutateLine(board, line, players, lines, lineIndex, stadiumDiscards, knowledge, context);
          else runtime.report('unsupported-language');
        });
        const event = buildEvent(`event-${sectionIndex}-${actionIndex}`, action, lines, players);
        const bonus = action.title.match(/^(.+) drew (\d+) more cards? because (.+) took at least 1 mulligan\.$/);
        if (sectionIndex === 0 && bonus && mulligans[bonus[3]] !== undefined) {
          event.mulliganBonus = {
            player: bonus[1], opponent: bonus[3], cards: Number(bonus[2]),
            playerMulligans: mulligans[bonus[1]] ?? 0, opponentMulligans: mulligans[bonus[3]],
          };
        }
        pushFrame(sectionIndex, actionIndex, section.turnTitle, section.player, event);
      });

      Object.entries(section.prizesAfterTurn).forEach(([playerName, prizesRemaining]) => {
        if (board.players[playerName]) board.players[playerName].prizesRemaining = prizesRemaining;
      });
    });

    if (frames.length === 0) {
      pushFrame(0, null, 'Setup', '', { id: 'event-empty', kind: 'setup', title: 'Setup', details: [] });
    }

    knowledge.resolve();

    return {
      players: [perspectivePlayer, ...players.filter((player) => player !== perspectivePlayer)],
      perspectivePlayer,
      frames,
    };
  }

  return { replay: buildPass(), decisions: runtime.decisions, diagnostics: runtime.diagnostics, inferredFrames: Array.from(runtime.inferredFrames) };
}

export function buildBattleLogReplay(battleLog: BattleLog, perspectivePlayerName?: string | null, options: ReplayBuildOptions = {}): BattleLogReplay {
  return resolveReplay(battleLog, (runtime) => reconstruct(battleLog, perspectivePlayerName, runtime), options);
}
