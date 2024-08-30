import React from 'react'
import fs from 'fs'
import path from 'path'
import { AvatarDropdownMenu } from './AvatarDropdownMenu'

export const AvatarSelector = () => {
  const dirRelativeToPublicFolder = 'assets/trainers'
  const dir = path.resolve('./public', dirRelativeToPublicFolder);
  const filenames = fs.readdirSync(dir);

  const images = filenames.map(name => path.join('/', dirRelativeToPublicFolder, name))

  return (
    <AvatarDropdownMenu images={images} />
  )
}