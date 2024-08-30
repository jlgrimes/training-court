import { Database } from '@/database.types';
import { createClient } from '@/utils/supabase/server';
import { cache } from 'react'

export const fetchUserData = cache(async (userId: string) => {
  const supabase = createClient();
  const { data: userData } = await supabase.from('user data').select('*').eq('id', userId).returns<Database['public']['Tables']['user data']['Row'][]>().maybeSingle();
  
  return userData;
})