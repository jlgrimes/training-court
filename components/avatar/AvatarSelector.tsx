import React from 'react'
import { AvatarDropdownMenu } from './AvatarDropdownMenu'
import { fetchUserData } from '../user-data.utils'
import { fetchAvatarImages } from './avatar.server.utils';

export const AvatarSelector = async ({ userId }: { userId: string }) => {
  const images = fetchAvatarImages();
  const userData = await fetchUserData(userId);

  return (
    <AvatarDropdownMenu images={images} userId={userId} initialAvatar={userData?.avatar} />
  )
}