import { createClient } from '@/utils/supabase/server';
import { cache } from 'react'

export const fetchCurrentUser = cache(async () => {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user
})