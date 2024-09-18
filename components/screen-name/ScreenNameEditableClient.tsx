'use client';

import { useCallback, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { createClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
import { EditIcon } from "lucide-react";

export const ScreenNameEditableInputClient = ({ userId, liveScreenName }: { userId: string, liveScreenName: string | null | undefined }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [screenNameValue, setScreenNameValue] = useState('');

  const upsertScreenName = useCallback(async () => {
    const supabase = createClient();
    await supabase.from('user data').upsert({ id: userId, live_screen_name: screenNameValue });
    window.location.href = '/home';
  }, [screenNameValue]);

  if (isEditing || !liveScreenName) {
    return (
      <div className="flex w-full max-w-sm items-center space-x-2 gap-2">
        <Input autoFocus value={screenNameValue} onChange={(e) => setScreenNameValue(e.target.value)} placeholder="Screen name" />
        <Button disabled={screenNameValue.length === 0} onClick={() => upsertScreenName()}>Submit</Button>
      </div>
    )
  }

  return <div className="flex items-center gap-1">
    <h2 className="text-xl tracking-wide font-semibold text-slate-800">{liveScreenName}</h2>
    <Button onClick={() => setIsEditing(true)} size='icon' variant='ghost'><EditIcon className="h-4 w-4 stroke-muted-foreground" /></Button>
  </div>
}