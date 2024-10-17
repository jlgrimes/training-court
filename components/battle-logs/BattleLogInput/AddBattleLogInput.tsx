'use client';

import { track } from '@vercel/analytics';
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/client";
import { parseBattleLog } from "../utils/battle-log.utils";
import { BattleLog, BattleLogParsedWithResults } from '../utils/battle-log.types';

interface AddBattleLogInputProps {
  userData: Database['public']['Tables']['user data']['Row'] | null;
  handleAddLog: (newLog: BattleLog) => void;
}

export const AddBattleLogInput = (props: AddBattleLogInputProps) => {
  const [log, setLog] = useState('');
  const { toast } = useToast();

  const handleAddButtonClick = async () => {
    let parsedLog: BattleLog;
    try {
      parsedLog = parseBattleLog(log, '', '', '', '', null);
    } catch(error) {
      setLog('');
      return toast({
        variant: "destructive",
        title: "Your battle log was unable to be parsed.",
        description: `${error}`
      });
    }

    const supabase = createClient();

    const currentPlayer = parsedLog.players.find(
      (player) => player.name.toLowerCase() === props.userData?.live_screen_name?.toLowerCase()
    );
    const opponentPlayer = parsedLog.players.find(
      (player) => player.name.toLowerCase() !== props.userData?.live_screen_name?.toLowerCase()
    );

    const { data, error } = await supabase
      .from('logs')
      .insert({
        user: props.userData?.id ?? null,
        archetype: currentPlayer?.deck ?? 'unknown',
        opp_archetype: opponentPlayer?.deck ?? 'unknown',
        log: log
      })
      .select()
      .returns<BattleLogParsedWithResults[]>();

    if (error || !data) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message,
      });
    } else {
      const newLog: BattleLog = parseBattleLog(
        data[0].id,
        data[0].log,
        data[0].created_at,
        data[0].archetype,
        data[0].opp_archetype,
        props.userData?.live_screen_name ?? null
      );

      props.handleAddLog(newLog);

      setLog('');
      track('Import battle log');

      toast({
        title: "Battle log successfully imported!",
      });
    }
  };

  const isAddButtonDisabled = useMemo(() => {
    return log.length === 0;
  }, [log]);

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        className="resize-none"
        disabled={!props.userData?.live_screen_name || log.length === 0}
        placeholder="Paste battle log from PTCG Live here"
        value={log}
        onChange={(e) => setLog(e.target.value)}
      />
      <Button size='sm' onClick={handleAddButtonClick} disabled={isAddButtonDisabled}>Add new game</Button>
    </div>
  );
};
