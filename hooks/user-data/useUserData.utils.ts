import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/client";

export const fetchUserData = async (userId: string | undefined) => {
  if (!userId) return;

  const supabase = createClient();
  const { data: userData } = await supabase.from('user data').select('*').eq('id', userId).returns<Database['public']['Tables']['user data']['Row'][]>().maybeSingle();
  
  return userData;
};