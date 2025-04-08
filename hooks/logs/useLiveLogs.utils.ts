import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/client";

export const fetchLiveLogs = async (userId: string | undefined, offset = 0, limit = 50) => {
  if (!userId) return;

  const supabase = createClient();
  const { data: logData } = await supabase.from('logs').select('*').eq('user', userId).order('created_at', { ascending: false })
    .range(offset, offset + limit - 1).returns<Database['public']['Tables']['logs']['Row'][]>();
  return logData;
};