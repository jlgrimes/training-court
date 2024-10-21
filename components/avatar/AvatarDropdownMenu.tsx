'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from '@/utils/supabase/client';
import { getAvatarSrc, getMainSelectableAvatars } from './avatar.utils';
import { track } from '@vercel/analytics';
import { Button } from '../ui/button';

interface AvatarDropdownMenuProps {
  images: string[];
  userId: string;
  initialAvatar: string | null | undefined
}


export const AvatarDropdownMenu = (props: AvatarDropdownMenuProps) => {
  const [selectedImage, setSelectedImage] = useState<string | undefined>(props.initialAvatar ? getAvatarSrc(props.initialAvatar) : undefined);

  const renderImage = useCallback((image: string) => (
    <DropdownMenuItem key={image} onClick={() => setSelectedImage(image)}>
      <img src={image} height='48px' width='48px' className='pixel-image' />
    </DropdownMenuItem>
  ), [setSelectedImage]);

  const upsertImage = React.useCallback(async (filename: string) => {
    const supabase = createClient();
    await supabase.from('user data').upsert({ id: props.userId, avatar: filename });
    track('Avatar changed', { avatar: filename });
  }, [createClient]);

  useEffect(() => {
    const fileName = selectedImage?.split('/').reverse()[0];
    fileName && upsertImage(fileName)
  }, [selectedImage]);

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger>
          {selectedImage && <img src={selectedImage} height='48px' width='48px' className='pixel-image' />}
          {!selectedImage && (
            <Button className='h-[48px]' variant='outline'>
              Select an avatar
            </Button>
          )}
          </DropdownMenuTrigger>
        <DropdownMenuContent className='grid grid-cols-5'>
          <div className='col-span-5 grid grid-cols-5'>

          </div>
          {getMainSelectableAvatars(props.images, props.userId).map(renderImage)}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}