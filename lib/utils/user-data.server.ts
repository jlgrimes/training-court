import { Database } from '@/database.types';
import { createClient } from '@/utils/supabase/server';

type UserData = Database['public']['Tables']['user data']['Row'];

/**
 * Server-side user data fetching
 * For use in Server Components, Route Handlers, and Server Actions
 */
export async function fetchUserData(userId: string | null): Promise<UserData | null> {
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