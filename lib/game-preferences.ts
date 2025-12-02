export type GameId =
  | 'pokemon-tcg'
  | 'pokemon-pocket'
  // | 'mtg'
  // | 'yugioh'
  // | 'riftbound';

export interface GameOption {
  id: GameId;
  label: string;
  description?: string;
  available?: boolean;
}

export const GAME_OPTIONS: GameOption[] = [
  {
    id: 'pokemon-tcg',
    label: 'Pokémon TCG',
    description: 'Battle logs, tournaments, and stats',
    available: true,
  },
  {
    id: 'pokemon-pocket',
    label: 'Pokémon Pocket',
    description: 'Record Pocket games',
    available: true,
  },
  // {
  //   id: 'mtg',
  //   label: 'Magic: The Gathering',
  //   description: 'Coming soon',
  //   available: false,
  // },
  // {
  //   id: 'yugioh',
  //   label: 'YuGiOh',
  //   description: 'Coming soon',
  //   available: false,
  // },
  // {
  //   id: 'riftbound',
  //   label: 'Riftbound',
  //   description: 'Coming soon',
  //   available: false,
  // },
];

const VALID_GAME_IDS = new Set<GameId>(GAME_OPTIONS.map((game) => game.id));

export function normalizePreferredGames(preferredGames?: string[] | null): GameId[] {
  const source = Array.isArray(preferredGames) ? preferredGames : [];
  const filtered = source.filter((game): game is GameId =>
    VALID_GAME_IDS.has(game as GameId)
  );

  return filtered;
}

export function isGameEnabled(preferredGames: GameId[], gameId: GameId) {
  return preferredGames.includes(gameId);
}
