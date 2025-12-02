'use client';

import { useCallback, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { createClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
import { EditIcon } from "lucide-react";
import { useUserData } from "@/hooks/user-data/useUserData";

export const ScreenNameEditable = ({ userId }: { userId: string }) => {
  const { data: userData } = useUserData(userId);

  const [isEditing, setIsEditing] = useState(false);
  const [screenNameValue, setScreenNameValue] = useState('');

  const upsertScreenName = useCallback(async () => {
    const supabase = createClient();
    await supabase.from('user data').upsert({ id: userId, live_screen_name: screenNameValue });
    window.location.href = '/home';
  }, [screenNameValue]);

  if (isEditing || !userData?.live_screen_name) {
    return (
      <div className="flex w-full max-w-sm items-center space-x-2 gap-2">
        <Input autoFocus value={screenNameValue} onChange={(e) => setScreenNameValue(e.target.value)} placeholder="Name must be an EXACT match" />
        <Button disabled={screenNameValue.length === 0} onClick={() => upsertScreenName()}>Submit</Button>
      </div>
    )
  }

  return <div className="flex items-center gap-1">
    <h2 className="text-xl tracking-wide font-semibold">{userData.live_screen_name}</h2>
    <Button onClick={() => setIsEditing(true)} size='icon' variant='ghost'><EditIcon className="h-4 w-4 stroke-muted-foreground" /></Button>
  </div>
}