'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSetRecoilState } from 'recoil';
import {
  userAtom,
  sessionAtom,
  isAuthenticatedAtom,
  authLoadingAtom,
} from '@/app/recoil/atoms/user';
import { createClient } from '@/utils/supabase/client';

export function AuthBridge() {
  const setUser = useSetRecoilState(userAtom);
  const setSession = useSetRecoilState(sessionAtom);
  const setIsAuthed = useSetRecoilState(isAuthenticatedAtom);
  const setLoading = useSetRecoilState(authLoadingAtom);
  const router = useRouter();

  useEffect(() => {
    const sb = createClient();

    // Prime state on first paint
    (async () => {
      setLoading(true);
      const { data: { session } } = await sb.auth.getSession();
      setSession(session ?? null);
      setUser(session?.user ?? null);
      setIsAuthed(!!session?.user);
      setLoading(false);
    })();

    // Stay in sync with auth changes
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      // sync updates so UI flips immediately
      setSession(session ?? null);
      setUser(session?.user ?? null);
      setIsAuthed(!!session?.user);
      setLoading(false);
      // re-run server components (if any) that read auth cookies
      router.refresh();
    });

    return () => sub.subscription.unsubscribe();
  }, [setUser, setSession, setIsAuthed, setLoading, router]);

  return null;
}
