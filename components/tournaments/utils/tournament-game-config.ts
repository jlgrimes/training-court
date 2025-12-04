import { GameId } from "@/lib/game-preferences";
import { tournamentFormats } from "../Format/tournament-format.types";

export type TournamentGameConfig = {
  tournamentsTable: string;
  roundsTable: string;
  basePath: string;
  gameId: GameId;
  formats: string[];
};

export const PTCG_TOURNAMENT_CONFIG: TournamentGameConfig = {
  tournamentsTable: "tournaments",
  roundsTable: "tournament rounds",
  basePath: "/ptcg/tournaments",
  gameId: "pokemon-tcg",
  formats: tournamentFormats
};

export const POCKET_TOURNAMENT_CONFIG: TournamentGameConfig = {
  tournamentsTable: "pocket_tournaments",
  roundsTable: "pocket_tournament_rounds",
  basePath: "/pocket/tournaments",
  gameId: "pokemon-pocket",
  formats: ["A1", "A1a", "A2", "A2a", "A2b", "A3", "A3a", "A3b", "A4", "A4a", "A4b", "B1"]
};
