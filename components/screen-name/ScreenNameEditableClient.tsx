'use client';

import { useCallback, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardHeader } from "../ui/card";
import { Input } from "../ui/input";
import { createClient } from "@/utils/supabase/client";

export const ScreenNameEditableInputClient = ({ userId, liveScreenName }: { userId: string, liveScreenName: string | null | undefined }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [screenNameValue, setScreenNameValue] = useState('');

  const upsertScreenName = useCallback(async () => {
    const supabase = createClient();
    await supabase.from('user data').upsert({ id: userId, live_screen_name: screenNameValue });
    setIsEditing(false);
  }, [screenNameValue]);

  if (isEditing) {
    return (
      <Card>
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input autoFocus value={screenNameValue} onChange={(e) => setScreenNameValue(e.target.value)} />
          <Button disabled={screenNameValue.length === 0} onClick={() => upsertScreenName()}>Submit</Button>
        </div>
      </Card>
    )
  }

  if (!liveScreenName) {
    return (
      <Button variant='secondary' onClick={() => setIsEditing(true)}>Enter your Live screen name</Button>
    )
  }

  return <h2 className="text-xl tracking-wide font-semibold text-slate-800">{liveScreenName}</h2>
}