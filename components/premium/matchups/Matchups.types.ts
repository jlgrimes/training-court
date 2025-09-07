import { User } from "@supabase/supabase-js";

export type MatchupResult = {
  total: [number, number, number],
  goingFirst: [number, number, number],
  goingSecond: [number, number, number],
  lastPlayed: Date
}

export type DeckMatchup = Record<string, MatchupResult>;

export type Matchups = Record<string, DeckMatchup>;

export interface MatchupProps {
  userId: string | undefined;
  // if the drilldown switch shouldn't be there
  shouldDisableDrillDown?: boolean;
  // if the ability to filter by rounds shouldn't be there
  shouldDisableRoundGroup?: boolean;
}

export type MatchupRow = {
  source: string;
  deck: string;
  opp_deck: string;
  result: string;
  match_end_reason: string;
  turn_order: string;
  date: string;
  format: string;
};