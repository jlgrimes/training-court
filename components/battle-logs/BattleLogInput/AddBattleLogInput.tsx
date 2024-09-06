'use client';

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/client";
import { parseBattleLog } from "../utils/battle-log.utils";

interface AddBattleLogInputProps {
  userData: Database['public']['Tables']['user data']['Row'];
  handleAddLog: (newLog: Database['public']['Tables']['logs']['Row']) => void;
}

export const AddBattleLogInput = (props: AddBattleLogInputProps) => {
  const [log, setLog] = useState('');
  const { toast } = useToast();

  const handleAddButtonClick = async () => {
    try {
      parseBattleLog(log, '', '', null);
    } catch {
      setLog('');
      return toast({
        variant: "destructive",
        title: "Your battle log was unable to be parsed.",
        description: 'Please make sure you directly copy from TCG Live, then try again.'
      })
    }

    const supabase = createClient();

    const { data, error } = await supabase.from('logs').insert({
      user: props.userData.id,
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
      setLog('');

      toast({
        title: "Battle log successfully imported!",
      })
    }
  };

  const isAddButtonDisabled = useMemo(() => {
    return log.length === 0;
  }, [log]);

  return (
    <div className="flex gap-2">
      <Textarea
        className="resize-none"
        disabled={!props.userData.live_screen_name || log.length > 0}
        placeholder="Paste battle log from PTCG Live here"
        value={log} onChange={(e) => setLog(e.target.value)} />
      <Button onClick={handleAddButtonClick} disabled={isAddButtonDisabled}>Add new game</Button>
    </div>
  )
}