import React from 'react'
import fs from 'fs'
import path from 'path'
import { AvatarDropdownMenu } from './AvatarDropdownMenu'
import { fetchUserData } from '../user-data.utils'

export const AvatarSelector = async ({ userId }: { userId: string }) => {
  const dirRelativeToPublicFolder = 'assets/trainers'
  const dir = path.resolve('./public', dirRelativeToPublicFolder);
  const filenames = fs.readdirSync(dir);

  const images = filenames.map(name => path.join('/', dirRelativeToPublicFolder, name))

  const userData = await fetchUserData(userId);

  return (
    <AvatarDropdownMenu images={images} userId={userId} initialAvatar={userData?.avatar} />
  )
}