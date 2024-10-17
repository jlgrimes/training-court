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
  matchups: Matchups;
  userId: string | undefined;
  // if the drilldown switch shouldn't be there
  shouldDisableDrillDown?: boolean;
  // if the ability to filter by rounds shouldn't be there
  shouldDisableRoundGroup?: boolean;
}