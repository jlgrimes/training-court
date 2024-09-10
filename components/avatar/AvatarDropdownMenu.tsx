'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from '@/utils/supabase/client';
import { getAvatarSrc } from './avatar.utils';

interface AvatarDropdownMenuProps {
  images: string[];
  userId: string;
  initialAvatar: string | null | undefined
}

const exclusiveAvatars = ['ace trainer', 'cynthia', 'pokemon-center-lady'];

export const AvatarDropdownMenu = (props: AvatarDropdownMenuProps) => {
  const mainAvatars = useMemo(() => props.images.filter((img) => !exclusiveAvatars.some((avatar) => img.includes(avatar))), [exclusiveAvatars])

  const [selectedImage, setSelectedImage] = useState<string | undefined>(props.initialAvatar ? getAvatarSrc(props.initialAvatar) : undefined);

  const renderImage = useCallback((image: string) => (
    <DropdownMenuItem key={image} onClick={() => setSelectedImage(image)}>
      <img src={image} height='48px' width='48px' className='pixel-image' />
    </DropdownMenuItem>
  ), [setSelectedImage]);

  const upsertImage = React.useCallback(async (filename: string) => {
    const supabase = createClient();
    await supabase.from('user data').upsert({ id: props.userId, avatar: filename });
  }, []);

  useEffect(() => {
    const fileName = selectedImage?.split('/').reverse()[0];
    fileName && upsertImage(fileName)
  }, [selectedImage]);

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger><img src={selectedImage} height='48px' width='48px' className='pixel-image' /></DropdownMenuTrigger>
        <DropdownMenuContent className='grid grid-cols-5'>
          <div className='col-span-5 grid grid-cols-5'>
            
          </div>
          {mainAvatars.map(renderImage)}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}