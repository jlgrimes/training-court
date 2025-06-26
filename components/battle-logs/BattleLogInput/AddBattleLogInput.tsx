'use client';

import { track } from '@vercel/analytics';
import { useEffect, useState } from "react";
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
import { LogFormats, logFormats } from '@/components/tournaments/Format/tournament-format.types';
import Cookies from 'js-cookie';
import { ClipboardPaste, X } from 'lucide-react';

interface AddBattleLogInputProps {
  userData: Database['public']['Tables']['user data']['Row'] | null;
  handleAddLog: (newLog: Database['public']['Tables']['logs']['Row']) => void;
}

export const AddBattleLogInput = (props: AddBattleLogInputProps) => {
  const [log, setLog] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [format, setFormat] = useState(Cookies.get("format") || '');
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
      Cookies.set("format", format, { expires: 30 });
    }
  };

  useEffect(() => {
    const cookieFormat = Cookies.get("format");
    setFormat(cookieFormat || format);
  }, []);

  // const isAddButtonDisabled = useMemo(() => {
  //   return log.length === 0;
  // }, [log]);

  return (
    <div className="relative">
      <Textarea
        className="resize-none"
        disabled={!props.userData?.live_screen_name}
        placeholder="Paste PTCGL log here"
        value={log}
        onPaste={handlePaste}
        onChange={(e) => setLog(e.target.value)}
      />
      {!log &&
      <Button
      size="sm"
      className="absolute top-2 right-2 z-10"
      onClick={async () => {
          try {
            const text = await navigator.clipboard.readText();
            if (!text) {
              return toast({
                variant: "destructive",
                title: "Clipboard is empty",
                description: "Please copy a battle log first."
              });
            }

            setLog(text);
            const parsed = parseBattleLog(text, '', '', '', '', null);
            const details = getBattleLogMetadataFromLog(parsed, props.userData?.live_screen_name);
            setParsedLogDetails(details);
            setShowDialog(true);
          } catch (error) {
            toast({
              variant: "destructive",
              title: "Failed to parse clipboard contents",
              description: `${error}`,
            });
          }
        }}
        >
      <ClipboardPaste className="mr-2 h-4 w-4" />
        Add Log
      </Button>
      }

      {log && (
        <Button
          size="sm"
          variant="outline"
          className="absolute top-2 right-2 z-10"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Battle Log</DialogTitle>
            <DialogDescription>
              Below is the parsed information from your battle log. Confirm to add this result to your logs.
            </DialogDescription>
          </DialogHeader>
          {(parsedLogDetails && (
            <>
                <Label>{username}'s deck</Label>
                <AddArchetype archetype={archetype} setArchetype={setArchetype} />
                
                <Label>Opponent's Deck</Label>
                <AddArchetype archetype={oppArchetype} setArchetype={setOppArchetype} />

                <Label>Format</Label>
                  <Select value={format} onValueChange={(value) => setFormat(value as LogFormats)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {logFormats.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

              {/* @TODO: Should we be able to toggle who won or lost? How much should a user be able to adjust against our parsing algo? */}
              <Label>{username}'s Result: {parsedLogDetails.result}</Label>
            </>
            )
          )}
          <DialogFooter className="mt-4">
            <Button variant="secondary" onClick={() => setShowDialog(false)}>Close</Button>
            <Button onClick={handleAddButtonClick}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}