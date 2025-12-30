'use client';

import { useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { useAuth } from '../hooks/useAuth';

interface AuthHydrationProps {
  user: User | null;
}

/**
 * Hydrates Recoil auth state with server-provided user data.
 * Place this in your layout after fetching user on the server.
 * Only hydrates once per mount to avoid unnecessary re-renders.
 */
export function AuthHydration({ user }: AuthHydrationProps) {
  const { hydrateUser } = useAuth();
  const hydrated = useRef(false);

  useEffect(() => {
    if (!hydrated.current) {
      hydrateUser(user);
      hydrated.current = true;
    }
  }, [user, hydrateUser]);

  return null;
}
