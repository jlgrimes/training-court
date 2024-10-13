'use client';

import { track } from '@vercel/analytics';
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast"
import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/client";
import { parseBattleLog } from "../utils/battle-log.utils";
import { ClipboardCopyIcon } from 'lucide-react';

interface AddBattleLogInputProps {
  userData: Database['public']['Tables']['user data']['Row'] | null;
  handleAddLog: (newLog: Database['public']['Tables']['logs']['Row']) => void;
}

export const AddBattleLogButton = (props: AddBattleLogInputProps) => {
  const mostRecentlyAddedLog: React.MutableRefObject<string | null> = useRef(null);
  const { toast } = useToast();

  const handleAddButtonClick = async () => {
    const log = await navigator.clipboard.readText();
    if (log === mostRecentlyAddedLog.current) {
      return toast({
        variant: "destructive",
        title: "You just imported that log!",
        description: 'Try importing a different log.'
      })
    }

    try {
      parseBattleLog(log, '', '', '', '', null);
    } catch {
      return toast({
        variant: "destructive",
        title: "Your battle log was unable to be parsed.",
        description: 'Please make sure you directly copy from TCG Live, then try again.'
      })
    }

    const supabase = createClient();

    const { data, error } = await supabase.from('logs').insert({
      user: props.userData?.id ?? null,
      log: log
    }).select().returns<Database['public']['Tables']['logs']['Row'][]>();

    if (error || !data) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message,
      })
    } else {
      props.handleAddLog(data[0]);
      mostRecentlyAddedLog.current = data[0].log;
      track('Import battle log');

      toast({
        title: "Battle log successfully imported!",
      })
    }
  };

  return (
    <Button size='lg' onClick={handleAddButtonClick}><ClipboardCopyIcon className='h-4 w-4 mr-2' /> Import Live log from clipboard</Button>
  )
}