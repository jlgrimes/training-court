'use client';

import React, { useEffect, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from '@/utils/supabase/client';

interface AvatarDropdownMenuProps {
  images: string[];
  userId: string;
  initialAvatar: string | null | undefined
}

export const AvatarDropdownMenu = (props: AvatarDropdownMenuProps) => {
  const [selectedImage, setSelectedImage] = useState<string | undefined>(props.initialAvatar ? `/assets/trainers/${props.initialAvatar}` : undefined);

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
          {props.images.map((image) => <DropdownMenuItem onClick={() => setSelectedImage(image)}><img src={image} height='48px' width='48px' className='pixel-image' /></DropdownMenuItem>)}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}