import { Database } from '@/database.types';

export type TournamentGameId = 'pokemon-tcg' | 'pokemon-pocket';

export type TournamentTableName =
  | 'tournaments'
  | 'pocket_tournaments';

export type TournamentRoundsTableName =
  | 'tournament rounds'
  | 'pocket_tournament_rounds';

export interface TournamentTablesConfig {
  gameId: TournamentGameId;
  tournamentsTable: TournamentTableName;
  roundsTable: TournamentRoundsTableName;
  routeBase: string;
}

export const TOURNAMENT_CONFIGS: Record<TournamentGameId, TournamentTablesConfig> = {
  'pokemon-tcg': {
    gameId: 'pokemon-tcg',
    tournamentsTable: 'tournaments',
    roundsTable: 'tournament rounds',
    routeBase: '/tournaments',
  },
  'pokemon-pocket': {
    gameId: 'pokemon-pocket',
    tournamentsTable: 'pocket_tournaments',
    roundsTable: 'pocket_tournament_rounds',
    routeBase: '/pocket/tournaments',
  },
};

export const DEFAULT_TOURNAMENT_CONFIG = TOURNAMENT_CONFIGS['pokemon-tcg'];
