'use client'

import { useRecoilValue } from 'recoil';
import { userDataAtom, userDataLoadingAtom } from '@/app/recoil/atoms/user';

export function useUserData(userId: string | undefined) {
  const userData = useRecoilValue(userDataAtom);
  const isLoading = useRecoilValue(userDataLoadingAtom);

  // Only return data if it matches the requested userId
  const data = userData?.id === userId ? userData : undefined;

  return {
    data,
    isLoading,
    error: null
  }
}
