'use client';

import { useCallback } from "react";
import { useToast } from "../ui/use-toast";
import { createClient } from "@/utils/supabase/client";
import { FriendsDisplayProps } from "./FriendsDisplay";
import { Button } from "../ui/button";
import { PlusIcon } from "lucide-react";
import { Database } from "@/database.types";

export const CopySharableLinkButton = (props: FriendsDisplayProps) => {
  const { toast } = useToast();

  const handleFriendRequestCreate = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase.from('friend requests').insert({
      user_sending: props.userId,
      uses_remaining: 1
    }).select().returns<Database['public']['Tables']['friend requests']['Row'][]>();

    if (error) {
      return toast({
        variant: 'destructive',
        title: "Something went wrong",
        description: error.message
      });
    }

    if (!data) {
      return toast({
        variant: 'destructive',
        title: "Something went wrong",
        description: 'There is no data in the response body'
      });
    }

    navigator.clipboard.writeText(`https://trainingcourt.app/friend-request/${data[0].id}`);

    toast({
      title: 'Copied friend request link to clipboard!',
      description: 'The link is one-time use only.'
    });
  }, [props.userId]);

  return (
    <Button size='icon' onClick={handleFriendRequestCreate}><PlusIcon className='h-4 w-4'/></Button>
  )
}