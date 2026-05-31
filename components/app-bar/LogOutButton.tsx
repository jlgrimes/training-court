'use client';

import { track } from '@vercel/analytics';
import { createClient } from "@/utils/supabase/client";
import { DropdownMenuItem } from '../ui/dropdown-menu';
import { T } from 'gt-react';

export const LogOutButton = () => {
  const handleLogOutClick =  async () => {
    track('Log out clicked');

    const supabase = createClient();
    // @TODO: quick way to ensure darkMode doesn't persist between different users sharing same local settings.
    localStorage.removeItem('darkMode');
    const { error } = await supabase.auth.signOut();
    if (!error) {
      window.location.href = '/'
    }
  };

  return (
    <DropdownMenuItem onClick={handleLogOutClick}>
      <T id="auth.logOut">Log out</T>
    </DropdownMenuItem> 
  )
};
