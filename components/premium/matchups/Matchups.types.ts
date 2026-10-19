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
  decklist_id?: string | null;
  opp_deck: string;
  result: string;
  match_end_reason: string;
  turn_order: string;
  date: string;
  format: string;
};

export type MatchupAggregateRow = {
  source: string;
  deck: string;
  decklist_id: string | null;
  opp_deck: string;
  format: string;
  wins: number;
  losses: number;
  ties: number;
  going_first_wins: number;
  going_first_losses: number;
  going_first_ties: number;
  going_second_wins: number;
  going_second_losses: number;
  going_second_ties: number;
  last_played: string;
};
