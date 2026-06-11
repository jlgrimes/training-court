'use client'

import { useCallback } from 'react';
import { useSetRecoilState } from 'recoil';
import { UserData, userDataAtom } from '@/app/recoil/atoms/user';
import { createClient } from '@/utils/supabase/client';

/**
 * Reloads the user data row into client state after a write so UI that
 * reads it (sidebar avatar, game sections) updates without a full page
 * reload. Mirrors the load in ClientAuthProvider.
 */
export function useRefreshUserData() {
  const setUserData = useSetRecoilState(userDataAtom);

  return useCallback(async (userId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('user data')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setUserData((data as UserData | null) ?? null);
  }, [setUserData]);
}
