'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRecoilValue } from 'recoil';
import { userAtom, authLoadingAtom } from '@/app/recoil/atoms/user';

/**
 * Client-side auth guard. Redirects when the visitor is not authenticated
 * after the session restore completes. Render nothing while `loading`.
 */
export function useAuthGuard(redirectTo: string = '/login') {
  const user = useRecoilValue(userAtom);
  const authLoading = useRecoilValue(authLoadingAtom);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(redirectTo);
    }
  }, [authLoading, user, router, redirectTo]);

  return { user, loading: authLoading };
}
