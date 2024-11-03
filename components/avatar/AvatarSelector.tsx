'use client';

import React from 'react'
import { AvatarDropdownMenu } from './AvatarDropdownMenu'
import { useUserData } from '@/hooks/user-data/useUserData';

export const AvatarSelector = ({ userId, avatarImages }: { userId: string, avatarImages: string[] }) => {
  const { data: userData } = useUserData(userId);

  return (
    <AvatarDropdownMenu images={avatarImages} userId={userId} initialAvatar={userData?.avatar} />
  )
}