'use client';

import React, { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AvatarDropdownMenuProps {
  images: string[];
}

export const AvatarDropdownMenu = (props: AvatarDropdownMenuProps) => {
  const [selectedImage, setSelectedImage] = useState<string>();

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