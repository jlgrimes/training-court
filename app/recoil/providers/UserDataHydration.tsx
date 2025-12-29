'use client';

import { useEffect, useRef } from 'react';
import { useSetRecoilState } from 'recoil';
import { UserData, userDataAtom, userDataLoadingAtom } from '../atoms/user';

interface UserDataHydrationProps {
  userData: UserData | null;
}

/**
 * Hydrates Recoil user data state with server-provided data.
 * Place this in your layout after fetching user data on the server.
 * Only hydrates once per mount to avoid unnecessary re-renders.
 */
export function UserDataHydration({ userData }: UserDataHydrationProps) {
  const setUserData = useSetRecoilState(userDataAtom);
  const setUserDataLoading = useSetRecoilState(userDataLoadingAtom);
  const hydrated = useRef(false);

  useEffect(() => {
    if (!hydrated.current) {
      setUserData(userData);
      setUserDataLoading(false);
      hydrated.current = true;
    }
  }, [userData, setUserData, setUserDataLoading]);

  return null;
}
