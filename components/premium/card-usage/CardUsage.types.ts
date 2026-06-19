import { Database } from "@/database.types";

export type CardUsageLogRow = Pick<
  Database["public"]["Tables"]["logs"]["Row"],
  | "archetype"
  | "created_at"
  | "decklist_id"
  | "format"
  | "id"
  | "log"
  | "opp_archetype"
  | "result"
  | "turn_order"
>;

export type CardPlayEvent = {
  logId: string;
  cardName: string;
  turnNumber: number;
};

export type CardUsageStat = {
  cardName: string;
  totalGames: number;
  gamesPlayed: number;
  usageRate: number;
  winsWhenPlayed: number;
  lossesWhenPlayed: number;
  tiesWhenPlayed: number;
  winRateWhenPlayed: number | null;
  winRateWhenNotPlayed: number | null;
  deltaWinRate: number | null;
  averageFirstTurnPlayed: number | null;
};
