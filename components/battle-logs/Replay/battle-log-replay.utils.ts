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
    .replace(/â€™/g, "'")
    .replace(/PokÃ©mon/g, 'Pokemon')
    .replace(/Pokémon/g, 'Pokemon')
    .trim();

const stripListPrefix = (line: string) =>
  normalizeLine(line).replace(/^[-\sâ€¢•]+/, '').trim();

const isCardListLine = (line: string) => {
  const stripped = stripListPrefix(line);
  if (!stripped || stripped.endsWith('.') || stripped.includes(' shuffled ')) return false;
  return stripped.includes(',') || /^[a-z][a-z0-9:'\-. ]+(?: ex| v)?$/.test(normalizeCardNameForLookup(normalizeReplayCardName(stripped)));
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

const findPokemon = (player: ReplayPlayerState, pokemonName: string) => {
  if (player.active && matchesReplayCard(player.active, pokemonName)) return player.active;
  return player.bench.find((pokemon) => matchesReplayCard(pokemon, pokemonName)) ?? null;
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

const setActivePokemon = (player: ReplayPlayerState, pokemonName: string) => {
  const existing = removePokemonFromBoard(player, pokemonName) ?? makePokemon(pokemonName);
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

const attachCardToPokemon = (player: ReplayPlayerState, cardName: string, pokemonName: string, fromDeck: boolean, knowledge: ReplayHandKnowledge) => {
  const target = findPokemon(player, pokemonName);
  if (!target) return;
  const card = fromDeck ? makeCard(cardName) : removeCardFromHand(player, cardName, knowledge);
  if (target) target.attachments.push(card);
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

const mutateLine = (board: ReplayBoardState, rawLine: string, players: string[], lines: string[], index: number, stadiumDiscards: Set<string>, knowledge: ReplayHandKnowledge) => {
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
    if (owner) setActivePokemon(owner, activeSpotMatch[2]);
    return;
  }

  const attachedMatch = line.match(/^-? ?(.+?) attached (.+?) to (.+?) (?:in the Active Spot|on the Bench)\.(?: .*)?$/);
  if (attachedMatch) {
    const owner = board.players[attachedMatch[1]];
    const targetName = attachedMatch[3].startsWith(`${owner?.name}'s `)
      ? attachedMatch[3].slice(owner.name.length + 3)
      : attachedMatch[3];
    const playedCard = lines[0]?.match(/^.+ played (.+)\.$/)?.[1];
    const fromDeck = !!playedCard && normalizeCardNameForLookup(normalizeReplayCardName(playedCard)) === 'crispin';
    if (owner) attachCardToPokemon(owner, attachedMatch[2], targetName, fromDeck, knowledge);
    return;
  }

  const evolvedMatch = line.match(/^-? ?(.+) evolved (.+) to (.+) (?:in the Active Spot|on the Bench)\.$/);
  if (evolvedMatch) {
    const owner = board.players[evolvedMatch[1]];
    const pokemon = owner ? findPokemon(owner, evolvedMatch[2]) : null;
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
    // Using the Stadium's effect does not play another copy from hand.
    if (board.stadium && matchesReplayCard(board.stadium, playedCardMatch[2])) return;
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

  const attackMatch = line.match(/^(.+)'s (.+) used (.+) on (.+)'s (.+) for (\d+) damage(?:\. .+ took (\d+) more damage.*)?\.$/);
  if (attackMatch) {
    const owner = board.players[attackMatch[4]];
    const target = owner ? findPokemon(owner, attackMatch[5]) : null;
    if (target) target.damage += Number(attackMatch[6]) + Number(attackMatch[7] ?? 0);
    return;
  }

  const damageCounterMatch = line.match(/^(\d+) damage counters? (?:was|were) placed on (.+)'s (.+?)(?: for .*)?\.$/);
  if (damageCounterMatch) {
    const owner = board.players[damageCounterMatch[2]];
    const target = owner ? findPokemon(owner, damageCounterMatch[3]) : null;
    if (target) target.damage += Number(damageCounterMatch[1]) * 10;
    return;
  }

  const healedMatch = line.match(/^-? ?(.+)'s (.+) healed (\d+) damage\.$/);
  if (healedMatch) {
    const owner = board.players[healedMatch[1]];
    const target = owner ? findPokemon(owner, healedMatch[2]) : null;
    if (target) target.damage = Math.max(0, target.damage - Number(healedMatch[3]));
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
    section.actions.forEach((action, actionIndex) => {
      const lines = getActionLines(action);
      const stadiumDiscards = new Set<string>();
      lines.forEach((line, lineIndex) => mutateLine(board, line, players, lines, lineIndex, stadiumDiscards, knowledge));
      pushFrame(sectionIndex, actionIndex, section.turnTitle, section.player, buildEvent(`event-${sectionIndex}-${actionIndex}`, action, lines, players));
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
