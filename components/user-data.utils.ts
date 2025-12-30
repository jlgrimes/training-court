import { cache } from 'react';
import { Database } from '@/database.types';
import { createClient } from '@/utils/supabase/server';
import { normalizePreferredGames } from '@/lib/game-preferences';

// cache() deduplicates calls within the same request
// So if fetchPreferredGames and the page both call fetchUserData, it only queries once
export const fetchUserData = cache(async (userId: string) => {
  const supabase = createClient();
  const { data: userData } = await supabase.from('user data').select('*').eq('id', userId).returns<Database['public']['Tables']['user data']['Row'][]>().maybeSingle();

  return userData;
});

export const fetchPreferredGames = async (userId: string) => {
  const userData = await fetchUserData(userId);
  return normalizePreferredGames(userData?.preferred_games);
};
