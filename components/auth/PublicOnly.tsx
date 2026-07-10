'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useRecoilValue } from 'recoil';
import { authLoadingAtom, userAtom } from '@/app/recoil/atoms/user';

export function PublicOnly({
  children,
  to = '/home',
}: {
  children: ReactNode;
  to?: string;
}) {
  const user = useRecoilValue(userAtom);
  const loading = useRecoilValue(authLoadingAtom);
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(to);
    }
  }, [loading, user, to, router]);

  if (loading || user) {
    return null;
  }

  return children;
}
