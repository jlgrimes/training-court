'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRecoilValue } from 'recoil';
import { userAtom, authLoadingAtom } from '@/app/recoil/atoms/user';

/**
 * Sends authenticated visitors away from public pages (e.g. landing → /home).
 * Client-side counterpart of the old server-side fetchCurrentUser + redirect.
 */
export function RedirectIfAuthed({ to = '/home' }: { to?: string }) {
  const user = useRecoilValue(userAtom);
  const loading = useRecoilValue(authLoadingAtom);
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push(to);
    }
  }, [loading, user, to, router]);

  return null;
}
