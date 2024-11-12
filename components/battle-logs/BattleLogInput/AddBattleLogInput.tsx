'use client';

import { track } from '@vercel/analytics';
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/client";
import { parseBattleLog } from "../utils/battle-log.utils";
import { getBattleLogMetadataFromLog } from './BattleLogInput.utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AddArchetype } from '@/components/archetype/AddArchetype/AddArchetype';
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { formatArray, FormatArray } from '@/components/tournaments/Format/tournament-format.types';
import { Skeleton } from '@/components/ui/skeleton';

interface AddBattleLogInputProps {
  userData: Database['public']['Tables']['user data']['Row'] | null;
  handleAddLog: (newLog: Database['public']['Tables']['logs']['Row']) => void;
}

export const AddBattleLogInput = (props: AddBattleLogInputProps) => {
  const [log, setLog] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [format, setFormat] = useState('BRS-SCR');
  const [parsedLogDetails, setParsedLogDetails] = useState<{
    archetype: string | null;
    opp_archetype: string | null;
    turn_order: string | null;
    result: string | null;
  } | null>(null);
  const [archetype, setArchetype] = useState<string | undefined>();
  const [oppArchetype, setOppArchetype] = useState<string | undefined>();
  const username = props.userData?.live_screen_name;
  const { toast } = useToast();

  useEffect(() => {
    if (parsedLogDetails) {
      setArchetype(parsedLogDetails.archetype ?? '');
      setOppArchetype(parsedLogDetails.opp_archetype ?? '');
    }
  }, [parsedLogDetails]);

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = event.clipboardData.getData('Text');
    setLog(pastedText);

    try {
      const parsedLog = parseBattleLog(pastedText, '', '', '', '', null);
      const details = getBattleLogMetadataFromLog(parsedLog, props.userData?.live_screen_name);
      setParsedLogDetails(details);
      setShowDialog(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Your battle log was unable to be parsed.",
        description: `${error}`
      });
    }
  };

  const handleClear = () => {
    setLog('');
    setParsedLogDetails(null);
    setShowDialog(false);
  };

  const handleAddButtonClick = async () => {
    let parsedLog;
    try {
      parsedLog = parseBattleLog(log, '', '', '', '', null);
    } catch(error) {
      setLog('');
      return toast({
        variant: "destructive",
        title: "Your battle log was unable to be parsed.",
        description: `${error}`
      })
    }

    const supabase = createClient();

    const { turn_order, result } = getBattleLogMetadataFromLog(parsedLog, props.userData?.live_screen_name);

    const { data, error } = await supabase.from('logs').insert({
      user: props.userData?.id ?? null,
      archetype,
      opp_archetype: oppArchetype,
      log,
      turn_order,
      result,
      format
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
      track('Import battle log');

      toast({
        title: "Battle log successfully imported!",
      })
      setLog('');
      setParsedLogDetails(null);
      setShowDialog(false);
    }
  };

  const isAddButtonDisabled = useMemo(() => {
    return log.length === 0;
  }, [log]);


  //@TODO: What I want to do here is when someone pastes a battle log, it populates a modal with the relevant details. 
  // From here, the user can adjust format and player decks before submitting the log. 
  // Also should be able to set the default format in user preferences.
  return (
    <div className="flex flex-col gap-2">
      <Textarea
        className="resize-none"
        disabled={!props.userData?.live_screen_name}
        placeholder="Paste battle log from PTCG Live here"
        value={log}
        onPaste={handlePaste}
      />
      <div className="flex gap-2">
        {/* <Button size="sm" onClick={handleAddButtonClick} disabled={isAddButtonDisabled}>Add new game</Button> */}
        <Button size="sm" variant="secondary" onClick={handleClear}>Clear</Button>
      </div>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Battle Log</DialogTitle>
            <DialogDescription>
              Below is the parsed information from your battle log. Confirm to add or close to edit further.
            </DialogDescription>
          </DialogHeader>
          {parsedLogDetails && (
            <>
                <Label>{username}'s deck</Label>
                <AddArchetype archetype={archetype} setArchetype={setArchetype} />
                
                <Label>Opponent's Deck</Label>
                <AddArchetype archetype={oppArchetype} setArchetype={setOppArchetype} />

                <Label>Format</Label>
                <Select value={format} onValueChange={(value) => setFormat(value as FormatArray)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {formatArray.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label>{username}'s Result: {parsedLogDetails.result}</Label>
            </>
            )}
          <DialogFooter className="mt-4">
            <Button onClick={handleAddButtonClick}>Confirm and Add Log</Button>
            <Button variant="secondary" onClick={() => setShowDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}