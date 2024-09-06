'use client';

import { useCallback, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { createClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";

export const ScreenNameEditableInputClient = ({ userId, liveScreenName }: { userId: string, liveScreenName: string | null | undefined }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [screenNameValue, setScreenNameValue] = useState('');

  const upsertScreenName = useCallback(async () => {
    const supabase = createClient();
    await supabase.from('user data').upsert({ id: userId, live_screen_name: screenNameValue });
    setIsEditing(false);

    if (!liveScreenName) window.location.href = '/home';
  }, [screenNameValue]);

  if (isEditing || !liveScreenName) {
    return (
      <div className="flex w-full max-w-sm items-center space-x-2 gap-4">
        <Input autoFocus value={screenNameValue} onChange={(e) => setScreenNameValue(e.target.value)} placeholder="Screen name" />
        <Button disabled={screenNameValue.length === 0} onClick={() => upsertScreenName()}>Submit</Button>
      </div>
    )
  }

  return <h2 className="text-xl tracking-wide font-semibold text-slate-800">{liveScreenName}</h2>
}