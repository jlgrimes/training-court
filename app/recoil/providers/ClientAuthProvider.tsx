'use client';

import { useEffect } from 'react';
import { useSetRecoilState } from 'recoil';
import type { Session } from '@supabase/supabase-js';
import {
  UserData,
  authLoadingAtom,
  isAuthenticatedAtom,
  sessionAtom,
  userAtom,
  userDataAtom,
  userDataLoadingAtom,
} from '../atoms/user';
import { createClient } from '@/utils/supabase/client';

/**
 * Client-side auth hydration: restores the Supabase session from local
 * storage (no network round trip), loads the user data row, and keeps
 * Recoil state in sync with auth changes (sign in/out, token refresh).
 * Replaces the server-passed AuthHydration/UserDataHydration pair.
 */
export function ClientAuthProvider() {
  const setUser = useSetRecoilState(userAtom);
  const setSession = useSetRecoilState(sessionAtom);
  const setIsAuthenticated = useSetRecoilState(isAuthenticatedAtom);
  const setAuthLoading = useSetRecoilState(authLoadingAtom);
  const setUserData = useSetRecoilState(userDataAtom);
  const setUserDataLoading = useSetRecoilState(userDataLoadingAtom);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const loadUserData = async (userId: string) => {
      const { data } = await supabase
        .from('user data')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (cancelled) return;
      setUserData((data as UserData | null) ?? null);
      setUserDataLoading(false);
    };

    const applySession = (session: Session | null) => {
      if (cancelled) return;
      const user = session?.user ?? null;
      setUser(user);
      setSession(session?.access_token ?? null);
      setIsAuthenticated(!!user);
      setAuthLoading(false);
      if (user) {
        loadUserData(user.id);
      } else {
        setUserData(null);
        setUserDataLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data }) => applySession(data.session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [
    setUser,
    setSession,
    setIsAuthenticated,
    setAuthLoading,
    setUserData,
    setUserDataLoading,
  ]);

  return null;
}
