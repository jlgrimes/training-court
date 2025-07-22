'use client';

import { Database } from '@/database.types';
import { createClient } from '@/utils/supabase/client';

type UserData = Database['public']['Tables']['user data']['Row'];

/**
 * Client-side user data fetching
 * For use in Client Components
 */
export async function fetchUserData(userId: string | undefined): Promise<UserData | null> {
  if (!userId) return null;

  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('user data')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
  
  return data;
}