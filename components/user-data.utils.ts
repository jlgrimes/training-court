import { createClient } from '@/utils/supabase/server';
import { cache } from 'react'

export const fetchUserData = cache(async (userId: string) => {
  const supabase = createClient();
  const { data: userData } = await supabase.from('user data').select('avatar,live_screen_name').eq('id', userId).maybeSingle();
  
  return userData;
})