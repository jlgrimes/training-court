'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react'
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
import { useUserData } from '@/hooks/user-data/useUserData';
import { useRefreshUserData } from '@/hooks/user-data/useRefreshUserData';
import { useToast } from '@/components/ui/use-toast';
import { T, useGT } from 'gt-react';

interface AvatarDropdownMenuProps {
  images: string[];
  userId: string;
  initialAvatar: string | null | undefined
}


export const AvatarDropdownMenu = (props: AvatarDropdownMenuProps) => {
  const [selectedImage, setSelectedImage] = useState<string | undefined>(props.initialAvatar ? getAvatarSrc(props.initialAvatar) : undefined);
  const { data: userData } = useUserData(props.userId);
  const refreshUserData = useRefreshUserData();
  const [isSaving, setIsSaving] = useState(false);
  const saving = useRef(false);
  const { toast } = useToast();
  const gt = useGT();

  useEffect(() => {
    const avatar = userData ? userData.avatar : props.initialAvatar;
    setSelectedImage(avatar ? getAvatarSrc(avatar) : undefined);
  }, [userData, props.initialAvatar, props.userId]);

  const saveImage = useCallback(async (image: string) => {
    if (saving.current) return;
    saving.current = true;
    setIsSaving(true);
    try {
      const filename = image.replace(/\\/g, '/').split('/').pop()!;
      const supabase = createClient();
      const { error } = await supabase.from('user data').upsert({ id: props.userId, avatar: filename });
      if (error) throw error;
      setSelectedImage(getAvatarSrc(image));
      await refreshUserData(props.userId);
      track('Avatar changed', { avatar: filename });
    } catch (error) {
      console.error('Failed to save avatar', error);
      toast({
        title: gt('Could not save avatar', { $id: 'preferences.avatar.saveError' }),
        description: gt('Please try again.', { $id: 'common.pleaseTryAgain' }),
        variant: 'destructive',
      });
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  }, [props.userId, refreshUserData, toast, gt]);

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={isSaving}>
          <Button className='h-[48px]' variant='outline' disabled={isSaving}
            aria-label={gt('Select an avatar', { $id: 'preferences.avatar.select' })}>
            {selectedImage ? <img src={selectedImage} alt='' height='48px' width='48px' className='pixel-image' /> :
              <T id="preferences.avatar.select">Select an avatar</T>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='grid grid-cols-5'>
          {getMainSelectableAvatars(props.images, props.userId).map(image => (
            <DropdownMenuItem key={image} disabled={isSaving} onSelect={() => { void saveImage(image); }}>
              <img src={getAvatarSrc(image)} alt={image.replace(/\\/g, '/').split('/').pop()?.replace(/\.png$/i, '')}
                height='48px' width='48px' className='pixel-image' />
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
