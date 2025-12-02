import { GameId } from "@/lib/game-preferences";

export type TournamentGameConfig = {
  tournamentsTable: string;
  roundsTable: string;
  basePath: string;
  gameId: GameId;
};

export const PTCG_TOURNAMENT_CONFIG: TournamentGameConfig = {
  tournamentsTable: "tournaments",
  roundsTable: "tournament rounds",
  basePath: "/ptcg/tournaments",
  gameId: "pokemon-tcg",
};

export const POCKET_TOURNAMENT_CONFIG: TournamentGameConfig = {
  tournamentsTable: "pocket_tournaments",
  roundsTable: "pocket_tournament_rounds",
  basePath: "/pocket/tournaments",
  gameId: "pokemon-pocket",
};
