import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/client";

export const fetchUserData = async (userId: string | undefined) => {
  if (!userId) return;

  const supabase = createClient();
  const { data: userData, error } = await supabase
    .from('user data')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching user data:', error);
  }
  
  return userData;
};