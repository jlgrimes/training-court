'use client';

import { useRecoilValue } from 'recoil';
import { userDataAtom, userDataLoadingAtom } from '@/app/recoil/atoms/user';
import { AVATAR_IMAGES } from '@/lib/avatar-images';
import { TrainingCourtWelcomeClient } from './TrainingCourtWelcomeClient';

interface TrainingCourtWelcomeProps {
  userId: string | undefined;
}

export const TrainingCourtWelcome = ({ userId }: TrainingCourtWelcomeProps) => {
  const userData = useRecoilValue(userDataAtom);
  const userDataLoading = useRecoilValue(userDataLoadingAtom);

  if (!userId || userDataLoading) return null;

  // If user has screen name, don't render welcome
  if (userData?.live_screen_name) return null;

  return <TrainingCourtWelcomeClient userId={userId} avatarImages={AVATAR_IMAGES} />;
};
