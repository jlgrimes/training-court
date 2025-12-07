export type PocketTournament = {
  id: string;
  created_at: string;
  user: string;
  name: string;
  date_from: string;
  date_to: string;
  category: string | null;
  format: string | null;
  deck: string | null;
  placement: string | null;
  notes: string | null;
  hat_type: string | null;
};

export type PocketTournamentRound = {
  id: string;
  created_at: string;
  user: string;
  tournament: string;
  round_num: number;
  result: string[];
  deck: string | null;
  turn_orders: string[] | null;
  match_end_reason: string | null;
};
