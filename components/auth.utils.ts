import { cache } from 'react';
import { createClient } from '@/utils/supabase/server';

// cache() deduplicates calls within the same request
// So if page.tsx and generateMetadata both call this, it only runs once
export const fetchCurrentUser = cache(async () => {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});
