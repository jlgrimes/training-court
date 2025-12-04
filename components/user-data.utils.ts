import { Database } from '@/database.types';
import { createClient } from '@/utils/supabase/server';
import { normalizePreferredGames } from '@/lib/game-preferences';

export const fetchUserData = async (userId: string) => {
  const supabase = createClient();
  const { data: userData } = await supabase.from('user data').select('*').eq('id', userId).returns<Database['public']['Tables']['user data']['Row'][]>().maybeSingle();
  
  return userData;
};

export const fetchPreferredGames = async (userId: string) => {
  const userData = await fetchUserData(userId);
  return normalizePreferredGames(userData?.preferred_games);
};
