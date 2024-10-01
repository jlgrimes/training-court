import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/server";

export const fetchBattleLogs = async (userId: string) => {
  const supabase = createClient();
  const { data: logData } = await supabase.from('logs').select('*').eq('user', userId).order('created_at', { ascending: false }).returns<Database['public']['Tables']['logs']['Row'][]>();
  return logData;
};