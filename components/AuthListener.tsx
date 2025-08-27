// app/recoil/AuthListener.tsx
'use client';

import { authLoadingAtom, isAuthenticatedAtom, sessionAtom, userAtom, userProfileAtom } from '@/app/recoil';
import { createClient } from '@/utils/supabase/client';
import { useEffect } from 'react';
import { useSetRecoilState } from 'recoil';

export function AuthListener() {
  const setUser = useSetRecoilState(userAtom);
  const setProfile = useSetRecoilState(userProfileAtom);
  const setSession = useSetRecoilState(sessionAtom);
  const setAuthed = useSetRecoilState(isAuthenticatedAtom);
  const setLoading = useSetRecoilState(authLoadingAtom);

  useEffect(() => {
    const supabase = createClient();
    let alive = true;

    // initial fetch once on load
    (async () => {
      setLoading(true);
      const [{ data: { user } }, { data: { session } }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession(),
      ]);
      if (!alive) return;
      setUser(user ?? null);
      setAuthed(!!user);
      setSession(session?.access_token ?? null);
      if (!user) setProfile(null);
      setLoading(false);
    })();

    // live updates (login, token refresh, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ?? null;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setSession(null);
        setAuthed(false);
        return;
      }

      setUser(user);
      setAuthed(!!user);
      setSession(session?.access_token ?? null);
      if (!user) setProfile(null);
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [setUser, setProfile, setSession, setAuthed, setLoading]);

  return null;
}
