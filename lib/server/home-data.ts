import { createClient } from '@/utils/supabase/server';
import { Database } from '@/database.types';
import { normalizePreferredGames } from '@/lib/game-preferences';
import { startOfDay, endOfDay } from 'date-fns';

export type UserData = Database['public']['Tables']['user data']['Row'] & {
  preferred_games: string[];
};

export type BattleLog = Database['public']['Tables']['logs']['Row'];
export type Tournament = Database['public']['Tables']['tournaments']['Row'];
export type TournamentRound = Database['public']['Tables']['tournament rounds']['Row'];
export type PocketGame = Database['public']['Tables']['pocket_games']['Row'];

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

/**
 * Fetch user data server-side
 */
export async function fetchUserDataServer(userId: string): Promise<UserData | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('user data')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (!data) return null;

  return {
    ...data,
    preferred_games: normalizePreferredGames(data.preferred_games),
  };
}

/**
 * Fetch paginated battle logs by distinct days server-side
 */
export async function fetchBattleLogsServer(
  userId: string,
  page: number = 0,
  daysPerPage: number = 4
): Promise<BattleLog[]> {
  const supabase = createClient();

  // Step 1: Get all timestamps (cheap, select only created_at)
  const { data: timestamps, error: tsError } = await supabase
    .from('logs')
    .select('created_at')
    .eq('user', userId)
    .order('created_at', { ascending: false });

  if (tsError || !timestamps) {
    console.error('Error fetching timestamps:', tsError);
    return [];
  }

  // Step 2: Derive distinct day strings
  const allDays: string[] = [];
  const seenDays = new Set<string>();

  for (const { created_at } of timestamps) {
    const day = startOfDay(new Date(created_at)).toISOString();
    if (!seenDays.has(day)) {
      seenDays.add(day);
      allDays.push(day);
    }
  }

  // Step 3: Paginate distinct days
  const start = page * daysPerPage;
  const end = start + daysPerPage;
  const pagedDays = allDays.slice(start, end);

  if (pagedDays.length === 0) return [];

  // Step 4: Fetch logs for just those days
  const allLogs: BattleLog[] = [];

  for (const day of pagedDays) {
    const { data: dayLogs } = await supabase
      .from('logs')
      .select('*')
      .eq('user', userId)
      .gte('created_at', startOfDay(new Date(day)).toISOString())
      .lt('created_at', endOfDay(new Date(day)).toISOString())
      .order('created_at', { ascending: false });

    if (dayLogs) {
      allLogs.push(...dayLogs);
    }
  }

  return allLogs;
}

/**
 * Fetch tournaments server-side
 */
export async function fetchTournamentsServer(userId: string): Promise<Tournament[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tournaments')
    .select()
    .eq('user', userId)
    .order('date_from', { ascending: false });

  if (error) {
    console.error('Error fetching tournaments:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch tournament rounds server-side
 */
export async function fetchTournamentRoundsServer(userId: string): Promise<TournamentRound[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tournament rounds')
    .select()
    .eq('user', userId);

  if (error) {
    console.error('Error fetching tournament rounds:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch pocket games server-side
 */
export async function fetchPocketGamesServer(userId: string): Promise<PocketGame[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('pocket_games')
    .select('*')
    .eq('user', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pocket games:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch pocket tournaments server-side
 */
export async function fetchPocketTournamentsServer(userId: string): Promise<PocketTournament[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('pocket_tournaments')
    .select('*')
    .eq('user', userId)
    .order('date_from', { ascending: false });

  if (error) {
    console.error('Error fetching pocket tournaments:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch pocket tournament rounds server-side
 */
export async function fetchPocketTournamentRoundsServer(userId: string): Promise<PocketTournamentRound[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('pocket_tournament_rounds')
    .select('*')
    .eq('user', userId)
    .order('round_num', { ascending: true });

  if (error) {
    console.error('Error fetching pocket tournament rounds:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch all home page data in parallel for maximum performance
 */
export async function fetchHomeDataServer(userId: string, options: {
  includePtcg: boolean;
  includePocket: boolean;
}) {
  const promises: Promise<any>[] = [fetchUserDataServer(userId)];

  if (options.includePtcg) {
    promises.push(
      fetchBattleLogsServer(userId, 0, 4),
      fetchTournamentsServer(userId),
      fetchTournamentRoundsServer(userId)
    );
  }

  if (options.includePocket) {
    promises.push(
      fetchPocketGamesServer(userId),
      fetchPocketTournamentsServer(userId),
      fetchPocketTournamentRoundsServer(userId)
    );
  }

  const results = await Promise.all(promises);

  let idx = 0;
  const userData = results[idx++] as UserData | null;

  let battleLogs: BattleLog[] = [];
  let tournaments: Tournament[] = [];
  let tournamentRounds: TournamentRound[] = [];
  let pocketGames: PocketGame[] = [];
  let pocketTournaments: PocketTournament[] = [];
  let pocketTournamentRounds: PocketTournamentRound[] = [];

  if (options.includePtcg) {
    battleLogs = results[idx++] as BattleLog[];
    tournaments = results[idx++] as Tournament[];
    tournamentRounds = results[idx++] as TournamentRound[];
  }

  if (options.includePocket) {
    pocketGames = results[idx++] as PocketGame[];
    pocketTournaments = results[idx++] as PocketTournament[];
    pocketTournamentRounds = results[idx++] as PocketTournamentRound[];
  }

  return {
    userData,
    battleLogs,
    tournaments,
    tournamentRounds,
    pocketGames,
    pocketTournaments,
    pocketTournamentRounds,
  };
}
