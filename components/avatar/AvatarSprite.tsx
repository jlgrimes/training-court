import React from 'react'
import { getAvatarSrc } from './avatar.utils';

interface AvatarSpriteProps {
  fileName: string | undefined;
}

export const AvatarSprite = (props: AvatarSpriteProps) => {
  // TODO: Have some other fallback if sprite is undefined.
  if (props.fileName === undefined) return null;

  return (
    <img src={getAvatarSrc(props.fileName)} height='48px' width='48px' className='pixel-image' />
  )
}