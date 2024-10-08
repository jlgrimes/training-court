'use client';

import { track } from '@vercel/analytics';
import { createClient } from "@/utils/supabase/client";
import { NavigationMenuLink, navigationMenuTriggerStyle } from "../ui/navigation-menu";
import { cn } from "@/lib/utils";

export const LogOutButton = () => {
  const handleLogOutClick =  async () => {
    track('Log out clicked');

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (!error) {
      window.location.href = '/'
    }
  };

  return (
    <NavigationMenuLink onClick={handleLogOutClick} className={cn(
      navigationMenuTriggerStyle(),
      'cursor-pointer'
    )}>
      Log out
    </NavigationMenuLink> 
  )
};