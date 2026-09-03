import { BattleLog, BattleLogAction } from "@/components/battle-logs/utils/battle-log.types";
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
  return stripped.includes(',') || /^[A-Z][A-Za-z0-9:'\-. ]+(?: ex| V)?$/.test(stripped);
};

const parseCardList = (line: string): string[] => {
  const stripped = stripListPrefix(line);
  if (!isCardListLine(stripped)) return [];
  return stripped.split(',').map((card) => normalizeReplayCardName(card)).filter(Boolean);
};

const makeCard = (name: string, known = true): ReplayCard => ({
  id: makeEntityId(known ? 'known' : 'unknown', name),
  name: normalizeReplayCardName(name),
  known,
});

const makePokemon = (name: string): ReplayPokemon => ({
  id: makeEntityId('pokemon', name),
  name: normalizeReplayCardName(name),
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

const addUnknownCardsToHand = (player: ReplayPlayerState, count: number) => {
  player.hand.unknownCount += Math.max(0, count);
};

const removeCardFromHand = (player: ReplayPlayerState, cardName: string) => {
  const normalized = normalizeReplayCardName(cardName).toLowerCase();
  const idx = player.hand.knownCards.findIndex((card) => card.name.toLowerCase() === normalized);
  if (idx >= 0) return player.hand.knownCards.splice(idx, 1)[0];
  if (player.hand.unknownCount > 0) player.hand.unknownCount -= 1;
  return makeCard(cardName);
};

const discardCard = (player: ReplayPlayerState, cardName: string) => {
  player.discard.push(removeCardFromHand(player, cardName));
};

const findPokemon = (player: ReplayPlayerState, pokemonName: string) => {
  const normalizedName = normalizeReplayCardName(pokemonName).toLowerCase();
  if (player.active?.name.toLowerCase() === normalizedName) return player.active;
  return player.bench.find((pokemon) => pokemon.name.toLowerCase() === normalizedName) ?? null;
};

const removePokemonFromBoard = (player: ReplayPlayerState, pokemonName: string) => {
  const normalizedName = normalizeReplayCardName(pokemonName).toLowerCase();
  if (player.active?.name.toLowerCase() === normalizedName) {
    const removed = player.active;
    player.active = null;
    return removed;
  }
  const idx = player.bench.findIndex((pokemon) => pokemon.name.toLowerCase() === normalizedName);
  return idx >= 0 ? player.bench.splice(idx, 1)[0] : null;
};

const setActivePokemon = (player: ReplayPlayerState, pokemonName: string) => {
  const existing = removePokemonFromBoard(player, pokemonName) ?? makePokemon(pokemonName);
  if (player.active) player.bench.push(player.active);
  player.active = existing;
};

const playPokemon = (player: ReplayPlayerState, pokemonName: string, zone: 'active' | 'bench') => {
  removeCardFromHand(player, pokemonName);
  const pokemon = makePokemon(pokemonName);
  if (zone === 'active') {
    if (player.active) player.bench.push(player.active);
    player.active = pokemon;
  } else {
    player.bench.push(pokemon);
  }
};

const attachCardToPokemon = (player: ReplayPlayerState, cardName: string, pokemonName: string) => {
  const target = findPokemon(player, pokemonName) ?? player.active;
  const card = removeCardFromHand(player, cardName);
  if (target) target.attachments.push(card);
};

const discardAttachedCard = (player: ReplayPlayerState, cardName: string, pokemonName: string) => {
  const pokemon = findPokemon(player, pokemonName);
  if (!pokemon) {
    player.discard.push(makeCard(cardName));
    return;
  }
  const normalized = normalizeReplayCardName(cardName).toLowerCase();
  const idx = pokemon.attachments.findIndex((card) => card.name.toLowerCase() === normalized);
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

const mutateLine = (board: ReplayBoardState, rawLine: string, players: string[], lines: string[], index: number) => {
  const line = normalizeLine(rawLine);
  const playerName = findPlayer(line, players);
  const player = playerName ? board.players[playerName] : null;

  const openingHandMatch = line.match(/^(.+) drew 7 cards for the opening hand\.?/);
  if (openingHandMatch) {
    const actingPlayer = board.players[openingHandMatch[1]];
    if (actingPlayer) {
      const listIndex = lines[index + 1]?.includes('drawn cards') ? index + 1 : index;
      const listedCards = getFollowingCardList(lines, listIndex);
      listedCards.length > 0 ? addKnownCardsToHand(actingPlayer, listedCards) : addUnknownCardsToHand(actingPlayer, 7);
    }
    return;
  }

  const addedKnownCardMatch = line.match(/^(.+) was added to (.+)'s hand\.$/);
  if (addedKnownCardMatch) {
    const owner = board.players[addedKnownCardMatch[2]];
    if (owner) addKnownCardsToHand(owner, [addedKnownCardMatch[1]]);
    return;
  }

  const genericAddedMatch = line.match(/^A card was added to (.+)'s hand\.$/);
  if (genericAddedMatch) {
    const owner = board.players[genericAddedMatch[1]];
    if (owner) addUnknownCardsToHand(owner, 1);
    return;
  }

  const drewNamedMatch = line.match(/^-? ?(.+) drew ([A-Z][^\.]+)\.$/);
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
      if (line.includes('played them to the Bench')) cardNames.forEach((cardName) => playPokemon(owner, cardName, 'bench'));
      else if (cardNames.length > 0) addKnownCardsToHand(owner, cardNames);
      else addUnknownCardsToHand(owner, Number(drewCountMatch[2]));
    }
    return;
  }

  const drewSingleUnknownMatch = line.match(/^-? ?(.+) drew a card\.$/);
  if (drewSingleUnknownMatch) {
    const owner = board.players[drewSingleUnknownMatch[1]];
    if (owner) addUnknownCardsToHand(owner, 1);
    return;
  }

  const playedPokemonMatch = line.match(/^(.+) played (.+) to the (Active Spot|Bench)\.$/);
  if (playedPokemonMatch) {
    const owner = board.players[playedPokemonMatch[1]];
    if (owner) playPokemon(owner, playedPokemonMatch[2], playedPokemonMatch[3] === 'Active Spot' ? 'active' : 'bench');
    return;
  }

  const activeSpotMatch = line.match(/^(.+)'s (.+) is now in the Active Spot\.$/);
  if (activeSpotMatch) {
    const owner = board.players[activeSpotMatch[1]];
    if (owner) setActivePokemon(owner, activeSpotMatch[2]);
    return;
  }

  const attachedMatch = line.match(/^-? ?(.+) attached (.+) to (?:(?:.+)'s )?(.+) (?:in the Active Spot|on the Bench)\.?$/);
  if (attachedMatch) {
    const owner = board.players[attachedMatch[1]];
    if (owner) attachCardToPokemon(owner, attachedMatch[2], attachedMatch[3]);
    return;
  }

  const evolvedMatch = line.match(/^-? ?(.+) evolved (.+) to (.+) (?:in the Active Spot|on the Bench)\.$/);
  if (evolvedMatch) {
    const owner = board.players[evolvedMatch[1]];
    const pokemon = owner ? findPokemon(owner, evolvedMatch[2]) : null;
    if (owner && pokemon) {
      removeCardFromHand(owner, evolvedMatch[3]);
      pokemon.name = normalizeReplayCardName(evolvedMatch[3]);
    }
    return;
  }

  const stadiumMatch = line.match(/^(.+) played (.+) to the Stadium spot\.$/);
  if (stadiumMatch) {
    const owner = board.players[stadiumMatch[1]];
    if (owner) board.stadium = removeCardFromHand(owner, stadiumMatch[2]);
    return;
  }

  const playedCardMatch = line.match(/^(.+) played (.+)\.$/);
  if (playedCardMatch && player) {
    player.discard.push(removeCardFromHand(player, playedCardMatch[2]));
    return;
  }

  const discardedListMatch = line.match(/^-? ?(.+) discarded \d+ cards?\.$/);
  if (discardedListMatch) {
    const owner = board.players[discardedListMatch[1]];
    const cardNames = getFollowingCardList(lines, index);
    if (owner && cardNames.length > 0) cardNames.forEach((cardName) => discardCard(owner, cardName));
    return;
  }

  const discardedNamedMatch = line.match(/^-? ?(.+) discarded (.+)\.$/);
  if (discardedNamedMatch) {
    const owner = board.players[discardedNamedMatch[1]];
    if (owner) discardCard(owner, discardedNamedMatch[2]);
    return;
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
    if (owner) discardCard(owner, movedToDiscardMatch[3]);
    return;
  }

  const movedToHandMatch = line.match(/^-? ?(.+) moved (.+)'s (.+) to their hand\.$/);
  if (movedToHandMatch) {
    const owner = board.players[movedToHandMatch[2]];
    if (owner) addKnownCardsToHand(owner, [movedToHandMatch[3]]);
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
      owner.discard.push(makeCard(pokemon.name));
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
  const board = createInitialBoard(players);
  const frames: ReplayFrame[] = [];

  const pushFrame = (sectionIndex: number, actionIndex: number | null, turnTitle: string, currentPlayer: string, event: ReplayEvent) => {
    frames.push({
      id: `frame-${frames.length}`,
      index: frames.length,
      sectionIndex,
      actionIndex,
      turnTitle,
      currentPlayer,
      board: cloneBoard(board),
      event,
    });
  };

  battleLog.sections.forEach((section, sectionIndex) => {
    section.actions.forEach((action, actionIndex) => {
      const lines = getActionLines(action);
      lines.forEach((line, lineIndex) => mutateLine(board, line, players, lines, lineIndex));
      pushFrame(sectionIndex, actionIndex, section.turnTitle, section.player, buildEvent(`event-${sectionIndex}-${actionIndex}`, action, lines, players));
    });

    Object.entries(section.prizesAfterTurn).forEach(([playerName, prizesRemaining]) => {
      if (board.players[playerName]) board.players[playerName].prizesRemaining = prizesRemaining;
    });
  });

  if (frames.length === 0) {
    pushFrame(0, null, 'Setup', '', { id: 'event-empty', kind: 'setup', title: 'Setup', details: [] });
  }

  return {
    players: [perspectivePlayer, ...players.filter((player) => player !== perspectivePlayer)],
    perspectivePlayer,
    frames,
  };
}
