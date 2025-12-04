import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/client";
import { normalizePreferredGames } from "@/lib/game-preferences";

export const fetchUserData = async (userId: string | undefined) => {
  if (!userId) return;

  const supabase = createClient();
  const { data: userData } = await supabase.from('user data').select('*').eq('id', userId).returns<Database['public']['Tables']['user data']['Row'][]>().maybeSingle();
  
  if (!userData) return undefined;

  return {
    ...userData,
    preferred_games: normalizePreferredGames(userData.preferred_games),
  };
};
