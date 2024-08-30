import React from 'react';
import { fetchUserData } from '../user-data.utils';
import { ScreenNameEditableInputClient } from './ScreenNameEditableClient';

export const ScreenNameEditable = async ({ userId }: { userId: string }) => {
  const userData = await fetchUserData(userId);

  return <ScreenNameEditableInputClient userId={userId} liveScreenName={userData?.live_screen_name} />
}