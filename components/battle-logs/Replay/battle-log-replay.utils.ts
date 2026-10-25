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

const UNKNOWN_CARD_NAME = 'Unknown card';
let nextEntityId = 0;

const makeEntityId = (prefix: string, name: string) => {
  nextEntityId += 1;
  return `${prefix}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${nextEntityId}`;
};

export const normalizeReplayCardName = (name: string) => {
  const match = name.trim().match(/^\([^)]+\)\s+(.+)$/);
  return match ? match[1].trim() : name.trim();
};

const normalizeLine = (line: string) =>
  line
    .replace(/[\u2018\u2019]/g, "'")
    .trim();

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

const makePokemon = (name: string): ReplayPokemon => ({
  id: makeEntityId('pokemon', name),
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
        active: player.active
          ? { ...player.active, attachments: player.active.attachments.map((card) => ({ ...card })), status: [...player.active.status] }
          : null,
        bench: player.bench.map((pokemon) => ({
          ...pokemon,
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
  players.find((player) => line.toLowerCase().includes(player.toLowerCase()));

const addKnownCardsToHand = (player: ReplayPlayerState, cardNames: string[]) => {
  player.hand.knownCards.push(...cardNames.map((name) => makeCard(name)));
};

const addUnknownCardsToHand = (player: ReplayPlayerState, count: number, knowledge: ReplayHandKnowledge) => {
  knowledge.addUnknown(player, count);
};

const removeCardFromHand = (player: ReplayPlayerState, cardName: string, knowledge: ReplayHandKnowledge) => {
  const idx = player.hand.knownCards.findIndex((card) => matchesReplayCard(card, cardName));
  if (idx >= 0) return player.hand.knownCards.splice(idx, 1)[0];
  return knowledge.removeUnknown(player, cardName) ?? makeCard(cardName);
};

const discardCard = (player: ReplayPlayerState, cardName: string, knowledge: ReplayHandKnowledge) => {
  player.discard.push(removeCardFromHand(player, cardName, knowledge));
};

const findPokemon = (player: ReplayPlayerState, pokemonName: string, eligible: (pokemon: ReplayPokemon) => boolean = () => true) => {
  if (player.active && matchesReplayCard(player.active, pokemonName) && eligible(player.active)) return player.active;
  return player.bench.find((pokemon) => matchesReplayCard(pokemon, pokemonName) && eligible(pokemon)) ?? null;
};

const findPokemonInZone = (player: ReplayPlayerState, pokemonName: string, zone: string) =>
  findPokemon(player, pokemonName, (pokemon) => zone === 'in the Active Spot'
    ? pokemon === player.active : pokemon !== player.active);

// Split at a known player's possessive, not at a possessive inside a card name.
const pokemonReference = (board: ReplayBoardState, reference: string) => {
  const owner = board.playerOrder.find((name) => reference.startsWith(`${name}'s `));
  return owner ? { player: board.players[owner], name: reference.slice(owner.length + 3) } : null;
};

type ActionContext = {
  existingPokemonIds: Set<string>;
  ruinsTargets: Set<string>;
  spreadTargets: Set<string>;
  actions: BattleLogAction[];
  actionIndex: number;
};

const removePokemonFromBoard = (player: ReplayPlayerState, pokemonName: string) => {
  if (player.active && matchesReplayCard(player.active, pokemonName)) {
    const removed = player.active;
    player.active = null;
    return removed;
  }
  const idx = player.bench.findIndex((pokemon) => matchesReplayCard(pokemon, pokemonName));
  return idx >= 0 ? player.bench.splice(idx, 1)[0] : null;
};

const setActivePokemon = (player: ReplayPlayerState, pokemonName: string, context: ActionContext) => {
  const candidates = player.bench.filter((pokemon) => matchesReplayCard(pokemon, pokemonName));
  let promoted: ReplayPokemon | undefined;
  if (candidates.length > 1 && (!player.active || !matchesReplayCard(player.active, pokemonName))
    && normalizeCardNameForLookup(candidates[0].name) === 'dragapult ex') {
    const nextTitle = normalizeLine(context.actions[context.actionIndex + 1]?.title ?? '');
    const prefix = `${player.name}'s `;
    const attacker = nextTitle.startsWith(prefix)
      ? nextTitle.slice(prefix.length).match(/^(.+) used Jet Headbutt on .+ for \d+ damage\.$/)?.[1] : undefined;
    // Jet Headbutt needs one Colorless Energy. With only Basic Energy attached,
    // a unique powered copy resolves an otherwise identical-printing promotion.
    // Tools or Special Energy can change costs, so leave those cases ambiguous.
    const onlyBasicEnergy = candidates.every((pokemon) => pokemon.attachments.every((card) =>
      /^basic (grass|fire|water|lightning|psychic|fighting|darkness|metal|fairy) energy$/.test(normalizeCardNameForLookup(card.name))));
    const powered = candidates.filter((pokemon) => pokemon.attachments.length > 0);
    if (attacker && matchesReplayCard(candidates[0], attacker) && onlyBasicEnergy && powered.length === 1) promoted = powered[0];
  }
  const existing = promoted ? player.bench.splice(player.bench.indexOf(promoted), 1)[0]
    : removePokemonFromBoard(player, pokemonName) ?? makePokemon(pokemonName);
  if (player.active) player.bench.push(player.active);
  player.active = existing;
};

const playPokemon = (player: ReplayPlayerState, pokemonName: string, zone: 'active' | 'bench', knowledge: ReplayHandKnowledge) => {
  const card = removeCardFromHand(player, pokemonName, knowledge);
  const pokemon = { ...makePokemon(pokemonName), identifier: card.identifier };
  if (zone === 'active') {
    if (player.active) player.bench.push(player.active);
    player.active = pokemon;
  } else {
    player.bench.push(pokemon);
  }
};

const findAttachmentTarget = (player: ReplayPlayerState, cardName: string, pokemonName: string, zone: string, context: ActionContext) => {
  const target = findPokemonInZone(player, pokemonName, zone);
  if (!target || normalizeCardNameForLookup(target.name) !== 'munkidori'
    || normalizeCardNameForLookup(normalizeReplayCardName(cardName)) !== 'basic darkness energy') return target;

  const copies = [...(player.active ? [player.active] : []), ...player.bench]
    .filter((pokemon) => normalizeCardNameForLookup(pokemon.name) === 'munkidori');
  const unpowered = copies.find((pokemon) => pokemon.attachments.length === 0);
  const hasDarkness = target.attachments.some((card) => normalizeCardNameForLookup(card.name) === 'basic darkness energy');
  if (copies.length !== 2 || !unpowered || !hasDarkness || !matchesReplayCard(unpowered, pokemonName)
    || (zone === 'in the Active Spot' ? unpowered !== player.active : unpowered === player.active)) return target;

  // An attachment line cannot distinguish identical copies. Two subsequent
  // once-per-copy activations before any Energy/board change require both to
  // be powered. Do not spread attachments merely because a copy is unpowered.
  let uses = 0;
  for (let index = context.actionIndex + 1; index < context.actions.length; index++) {
    const lines = getActionLines(context.actions[index]);
    if (lines.some((line) => / attached | was discarded from | was Knocked Out!| retreated | shuffled .+ into their deck\./.test(line))) break;
    const title = lines[0];
    const prefix = `${player.name}'s `;
    const suffix = ' used Adrena-Brain.';
    if (title.startsWith(prefix) && title.endsWith(suffix)
      && matchesReplayCard(target, title.slice(prefix.length, -suffix.length))) {
      if (++uses === 2) return unpowered;
    }
  }
  return target;
};

type AttachmentSource = 'hand' | 'deck' | 'discard';
const attachCardToPokemon = (player: ReplayPlayerState, cardName: string, pokemonName: string, zone: string, source: AttachmentSource, knowledge: ReplayHandKnowledge, context: ActionContext) => {
  const target = findAttachmentTarget(player, cardName, pokemonName, zone, context);
  if (!target) return;
  const discardIndex = source === 'discard' ? player.discard.findIndex((card) => matchesReplayCard(card, cardName)) : -1;
  const card = source === 'hand' ? removeCardFromHand(player, cardName, knowledge)
    : discardIndex >= 0 ? player.discard.splice(discardIndex, 1)[0] : makeCard(cardName);
  target.attachments.push(card);
};

const discardAttachedCard = (player: ReplayPlayerState, cardName: string, pokemonName: string) => {
  const pokemon = findPokemon(player, pokemonName);
  if (!pokemon) {
    player.discard.push(makeCard(cardName));
    return;
  }
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
  const playerName = findPlayer(line, players);
  const player = playerName ? board.players[playerName] : null;

  const mulliganMatch = line.match(/^(.+) took (?:a|\d+) mulligans?\.$/);
  if (mulliganMatch) {
    const owner = board.players[mulliganMatch[1]];
    // Revealed mulligan cards were returned, and the replacement hand is hidden.
    if (owner) knowledge.reset(owner, 7);
    return;
  }

  const shuffledMatch = line.match(/^-? ?(.+) shuffled (a card|\d+ cards) into their deck\.$/);
  if (shuffledMatch) {
    const owner = board.players[shuffledMatch[1]];
    if (!owner) return;
    const listed = getFollowingCardList(lines, index);
    if (listed.length > 0) {
      const returned = listed.map((name) => ({ name, pokemon: removePokemonFromBoard(owner, name) }));
      const fromBoard = returned.some(({ pokemon }) => pokemon !== null);
      returned.forEach(({ name, pokemon }) => {
        // Evolution cards beneath a returned Pokemon were not in hand.
        if (!pokemon && (!fromBoard || owner.hand.knownCards.some((card) => matchesReplayCard(card, name)))) {
          removeCardFromHand(owner, name, knowledge);
        }
      });
    } else {
      const count = shuffledMatch[2] === 'a card' ? 1 : parseInt(shuffledMatch[2], 10);
      const remaining = Math.max(0, owner.hand.knownCards.length + owner.hand.unknownCount - count);
      // Without a list we cannot know which identities remain in hand.
      knowledge.reset(owner, remaining);
    }
    return;
  }

  const openingHandMatch = line.match(/^(.+) drew 7 cards for the opening hand\.?/);
  if (openingHandMatch) {
    const actingPlayer = board.players[openingHandMatch[1]];
    if (actingPlayer) {
      const listIndex = lines[index + 1]?.includes('drawn cards') ? index + 1 : index;
      const listedCards = getFollowingCardList(lines, listIndex);
      listedCards.length > 0 ? addKnownCardsToHand(actingPlayer, listedCards) : addUnknownCardsToHand(actingPlayer, 7, knowledge);
    }
    return;
  }

  const addedKnownCardMatch = line.match(/^(?!A card was added)(.+) was added to (.+)'s hand\.$/);
  if (addedKnownCardMatch) {
    const owner = board.players[addedKnownCardMatch[2]];
    if (owner) addKnownCardsToHand(owner, [addedKnownCardMatch[1]]);
    return;
  }

  const genericAddedMatch = line.match(/^A card was added to (.+)'s hand\.$/);
  if (genericAddedMatch) {
    const owner = board.players[genericAddedMatch[1]];
    if (owner) addUnknownCardsToHand(owner, 1, knowledge);
    return;
  }

  const drewToBenchMatch = line.match(/^-? ?(.+) drew (.+) and played it to the Bench\.$/);
  if (drewToBenchMatch) {
    const owner = board.players[drewToBenchMatch[1]];
    // These cards come directly from the deck, so the hand is unchanged.
    if (owner) owner.bench.push(makePokemon(drewToBenchMatch[2]));
    return;
  }

  const drewNamedMatch = line.match(/^-? ?(.+) drew ((?:\([^)]+\)\s+)?[A-Z][^\.]+)\.$/);
  if (drewNamedMatch && !line.includes(' drew a card') && !line.match(/drew \d+ cards/)) {
    const owner = board.players[drewNamedMatch[1]];
    if (owner) addKnownCardsToHand(owner, [drewNamedMatch[2]]);
    return;
  }

  const drewCountMatch = line.match(/^-? ?(.+) drew (\d+) cards(?: and played them to the Bench)?\.$/);
  if (drewCountMatch) {
    const owner = board.players[drewCountMatch[1]];
    if (owner) {
      const cardNames = getFollowingCardList(lines, index);
      if (line.includes('played them to the Bench')) owner.bench.push(...cardNames.map(makePokemon));
      else if (cardNames.length > 0) addKnownCardsToHand(owner, cardNames);
      else addUnknownCardsToHand(owner, Number(drewCountMatch[2]), knowledge);
    }
    return;
  }

  const drewSingleUnknownMatch = line.match(/^-? ?(.+) drew a card\.$/);
  if (drewSingleUnknownMatch) {
    const owner = board.players[drewSingleUnknownMatch[1]];
    if (owner) addUnknownCardsToHand(owner, 1, knowledge);
    return;
  }

  const playedPokemonMatch = line.match(/^(.+) played (.+) to the (Active Spot|Bench)\.$/);
  if (playedPokemonMatch) {
    const owner = board.players[playedPokemonMatch[1]];
    if (owner) playPokemon(owner, playedPokemonMatch[2], playedPokemonMatch[3] === 'Active Spot' ? 'active' : 'bench', knowledge);
    return;
  }

  const activeSpotMatch = line.match(/^(.+)'s (.+) is now in the Active Spot\.$/);
  if (activeSpotMatch) {
    const owner = board.players[activeSpotMatch[1]];
    if (owner) setActivePokemon(owner, activeSpotMatch[2], context);
    return;
  }

  const attachedMatch = line.match(/^-? ?(.+?) attached (.+?) to (.+?) (in the Active Spot|on the Bench)\.(?: .*)?$/);
  if (attachedMatch) {
    const owner = board.players[attachedMatch[1]];
    const targetName = attachedMatch[3].startsWith(`${owner?.name}'s `)
      ? attachedMatch[3].slice(owner.name.length + 3)
      : attachedMatch[3];
    const playedCard = lines[0]?.match(/^.+ played (.+)\.$/)?.[1];
    const effect = playedCard ? normalizeCardNameForLookup(normalizeReplayCardName(playedCard)) : '';
    const source: AttachmentSource = effect === 'crispin' ? 'deck' : effect === "rosa's encouragement" ? 'discard' : 'hand';
    if (owner) attachCardToPokemon(owner, attachedMatch[2], targetName, attachedMatch[4], source, knowledge, context);
    return;
  }

  const evolvedMatch = line.match(/^-? ?(.+) evolved (.+) to (.+) (in the Active Spot|on the Bench)\.$/);
  if (evolvedMatch) {
    const owner = board.players[evolvedMatch[1]];
    const pokemon = owner ? findPokemonInZone(owner, evolvedMatch[2], evolvedMatch[4]) : null;
    if (owner && pokemon) {
      const evolvedCard = removeCardFromHand(owner, evolvedMatch[3], knowledge);
      pokemon.name = normalizeReplayCardName(evolvedMatch[3]);
      pokemon.identifier = evolvedCard.identifier;
    }
    return;
  }

  const stadiumMatch = line.match(/^(.+) played (.+) to the Stadium spot\.$/i);
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

  const discardedStadiumMatch = line.match(/^(?:- )?(.+) was discarded from the Stadium spot\.$/i);
  if (discardedStadiumMatch) {
    if (board.stadium && matchesReplayCard(board.stadium, discardedStadiumMatch[1])) {
      const stadium = board.stadium;
      if (stadium.owner && board.players[stadium.owner]) board.players[stadium.owner].discard.push(stadium);
      board.stadium = null;
    }
    return;
  }

  const playedCardMatch = line.match(/^(.+) played (.+)\.$/);
  if (playedCardMatch && player) {
    // Logs can say "played" when activating a Stadium or an in-play Pokemon.
    // Actual Pokemon plays have already matched the explicit board-zone form.
    if (board.stadium && matchesReplayCard(board.stadium, playedCardMatch[2])) return;
    if (findPokemon(player, playedCardMatch[2])) return;
    player.discard.push(removeCardFromHand(player, playedCardMatch[2], knowledge));
    return;
  }

  const discardedListMatch = line.match(/^-? ?(.+) discarded \d+ cards?\.$/);
  if (discardedListMatch) {
    const owner = board.players[discardedListMatch[1]];
    const cardNames = getFollowingCardList(lines, index);
    if (owner && cardNames.length > 0) cardNames.forEach((cardName) => discardCard(owner, cardName, knowledge));
    return;
  }

  const discardedNamedMatch = line.match(/^-? ?(.+) discarded (.+)\.$/);
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

  const discardedFromMatch = line.match(/^-? ?(.+) was discarded from (.+)'s (.+)\.$/);
  if (discardedFromMatch) {
    const owner = board.players[discardedFromMatch[2]];
    if (owner) discardAttachedCard(owner, discardedFromMatch[1], discardedFromMatch[3]);
    return;
  }

  const movedToDiscardMatch = line.match(/^-? ?(.+) moved (.+)'s (.+) to the discard pile\.$/);
  if (movedToDiscardMatch) {
    const owner = board.players[movedToDiscardMatch[2]];
    if (owner) discardCard(owner, movedToDiscardMatch[3], knowledge);
    return;
  }

  const movedToHandMatch = line.match(/^-? ?(.+) moved (.+)'s (.+) to their hand\.$/);
  if (movedToHandMatch) {
    const owner = board.players[movedToHandMatch[2]];
    if (owner) {
      const discardIndex = owner.discard.findIndex((card) => matchesReplayCard(card, movedToHandMatch[3]));
      const card = discardIndex >= 0 ? owner.discard.splice(discardIndex, 1)[0] : makeCard(movedToHandMatch[3]);
      owner.hand.knownCards.push(card);
    }
    return;
  }

  const attackMatch = line.match(/^.+? used .+? on (.+) for (\d+) damage(?:\. .+ took (\d+) more damage.*)?\.$/);
  if (attackMatch) {
    const reference = pokemonReference(board, attackMatch[1]);
    const target = reference ? findPokemon(reference.player, reference.name) : null;
    if (target) target.damage += Number(attackMatch[2]) + Number(attackMatch[3] ?? 0);
    return;
  }

  const movedCounters = line.match(/^-? ?.+? moved (a|\d+) damage counters? from (.+?) to (.+)\.$/);
  if (movedCounters) {
    const adrenaBrain = lines[0]?.match(/^(.+)'s .+ used Adrena-Brain\.$/);
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
    const source = sourceOwner && sourceReference
      ? findPokemon(sourceOwner, sourceReference.name, (pokemon) => pokemon.damage >= amount)
        ?? findPokemon(sourceOwner, sourceReference.name, (pokemon) => pokemon.damage > 0)
      : null;
    const target = targetOwner && targetReference ? findPokemon(targetOwner, targetReference.name) : null;
    if (source && target && source !== target) {
      const damage = Math.min(source.damage, amount);
      source.damage -= damage;
      target.damage += damage;
    }
    return;
  }

  const placedCounters = line.match(/^-? ?.+? put (a|\d+) damage counters? on (.+)\.$/);
  if (placedCounters) {
    const reference = pokemonReference(board, placedCounters[2]);
    const riskyRuins = lines.slice(0, index).includes('Risky Ruins was activated.');
    const phantomDive = lines[0]?.match(/^.+ used Phantom Dive on (.+) for \d+ damage\./);
    // Stadium counters belong to the copy just benched in this action, even
    // when Live prints an incorrect owner or another copy is already in play.
    const newlyBenched = riskyRuins && reference
      ? Object.values(board.players).flatMap((owner) => owner.bench).find((pokemon) =>
        !context.existingPokemonIds.has(pokemon.id) && !context.ruinsTargets.has(pokemon.id)
        && matchesReplayCard(pokemon, reference.name))
      : null;
    const defendingPlayer = phantomDive ? pokemonReference(board, phantomDive[1])?.player : null;
    const spreadCandidates = defendingPlayer && reference
      ? defendingPlayer.bench.filter((pokemon) => matchesReplayCard(pokemon, reference.name)) : [];
    // Phantom Dive's counters affect the defending Bench. Live can repeat the
    // attacker's owner label and cannot distinguish identical printings. Assign
    // separate placement lines to separate matching copies in bench order.
    const spreadTarget = spreadCandidates.find((pokemon) => !context.spreadTargets.has(pokemon.id)) ?? spreadCandidates[0];
    const target = newlyBenched ?? (phantomDive && !riskyRuins
      ? spreadTarget : reference ? findPokemon(reference.player, reference.name) : null);
    const count = placedCounters[1] === 'a' ? 1 : Number(placedCounters[1]);
    if (target) {
      target.damage += count * 10;
      if (riskyRuins) context.ruinsTargets.add(target.id);
      if (phantomDive && !riskyRuins) context.spreadTargets.add(target.id);
    }
    return;
  }

  const damageCounterMatch = line.match(/^(\d+) damage counters? (?:was|were) placed on (.+?)(?: for .*)?\.$/);
  if (damageCounterMatch) {
    const reference = pokemonReference(board, damageCounterMatch[2]);
    const target = reference ? findPokemon(reference.player, reference.name) : null;
    if (target) target.damage += Number(damageCounterMatch[1]) * 10;
    return;
  }

  const healedMatch = line.match(/^-? ?(.+) healed (\d+) damage\.$/);
  if (healedMatch) {
    const reference = pokemonReference(board, healedMatch[1]);
    const target = reference ? findPokemon(reference.player, reference.name, (pokemon) => pokemon.damage > 0) : null;
    if (target) target.damage = Math.max(0, target.damage - Number(healedMatch[2]));
    return;
  }

  const knockedOutMatch = line.match(/^(.+)'s (.+) was Knocked Out!$/);
  if (knockedOutMatch) {
    const owner = board.players[knockedOutMatch[1]];
    const pokemon = owner ? removePokemonFromBoard(owner, knockedOutMatch[2]) : null;
    if (owner && pokemon) {
      owner.discard.push({ ...makeCard(pokemon.name), identifier: pokemon.identifier });
      owner.discard.push(...pokemon.attachments);
    }
    return;
  }

  const prizesMatch = line.match(/^(.+) took (\d+|a) Prize cards?/);
  if (prizesMatch) {
    const owner = board.players[prizesMatch[1]];
    const prizeCount = prizesMatch[2] === 'a' ? 1 : Number(prizesMatch[2]);
    if (owner) owner.prizesRemaining = Math.max(0, owner.prizesRemaining - prizeCount);
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

export function buildBattleLogReplay(battleLog: BattleLog, perspectivePlayerName?: string | null): BattleLogReplay {
  nextEntityId = 0;
  const players = battleLog.players.map((player) => player.name);
  const perspectivePlayer = players.find((player) => player.toLowerCase() === perspectivePlayerName?.toLowerCase()) ?? players[0];
  const knowledge = new ReplayHandKnowledge(perspectivePlayer, makeCard);
  const board = createInitialBoard(players);
  const frames: ReplayFrame[] = [];
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
    const snapshot = cloneBoard(board);
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
    });
  };

  battleLog.sections.forEach((section, sectionIndex) => {
    const actions = sectionIndex === 0 ? orderSetupActions(section.actions, players) : section.actions;
    actions.forEach((action, actionIndex) => {
      const lines = getActionLines(action);
      const stadiumDiscards = new Set<string>();
      const context: ActionContext = {
        existingPokemonIds: new Set(Object.values(board.players).flatMap((player) =>
          [...(player.active ? [player.active] : []), ...player.bench].map((pokemon) => pokemon.id))),
        ruinsTargets: new Set(),
        spreadTargets: new Set(),
        actions,
        actionIndex,
      };
      lines.forEach((line, lineIndex) => mutateLine(board, line, players, lines, lineIndex, stadiumDiscards, knowledge, context));
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
