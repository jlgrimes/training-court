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
import type { BattleLog } from '@/lib/server/home-data';
import { T, useGT } from 'gt-react';

interface AddBattleLogInputProps {
  userData: Database['public']['Tables']['user data']['Row'] | null;
  /** Callback when a log is successfully added */
  onLogAdded?: (log: BattleLog) => void;
}

export const AddBattleLogInput = (props: AddBattleLogInputProps) => {
  const [log, setLog] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [format, setFormat] = useState<LogFormats | undefined>(Cookies.get("format") as LogFormats | undefined);
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
  const gt = useGT();

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
        title: gt("Your battle log was unable to be parsed.", { $id: "battleLogs.input.parseError" }),
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
        title: gt("Your battle log was unable to be parsed.", { $id: "battleLogs.input.parseError" }),
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
      return toast({
        variant: "destructive",
        title: gt("Uh oh! Something went wrong.", { $id: "common.errorTitle" }),
        description: error?.message ?? 'Insert failed',
      });
    }

    const saved = data[0];
    props.onLogAdded?.(saved);

    track('Import battle log');
    toast({ title: gt("Battle log successfully imported!", { $id: "battleLogs.input.importSuccess" }) });

    setLog('');
    setParsedLogDetails(null);
    setShowDialog(false);
    if (format) Cookies.set("format", format, { expires: 30 });
  };



  return (
    <div className="relative">
      <Textarea
        className="resize-none"
        disabled={!props.userData?.live_screen_name}
        placeholder={gt("Paste PTCGL log here", { $id: "battleLogs.input.placeholder" })}
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
                title: gt("Clipboard is empty", { $id: "battleLogs.input.clipboardEmpty" }),
                description: gt("Please copy a battle log first.", { $id: "battleLogs.input.copyFirst" })
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
              title: gt("Failed to parse clipboard contents", { $id: "battleLogs.input.clipboardParseFailed" }),
              description: `${error}`,
            });
          }
        }}
        >
      <ClipboardPaste className="mr-2 h-4 w-4" />
        <T id="battleLogs.input.addLog">Add Log</T>
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
            <DialogTitle><T id="battleLogs.input.reviewTitle">Review Battle Log</T></DialogTitle>
            <DialogDescription>
              <T id="battleLogs.input.reviewDescription">Below is the parsed information from your battle log. Confirm to add this result to your logs.</T>
            </DialogDescription>
          </DialogHeader>
          {(parsedLogDetails && (
            <>
                <Label><T id="battleLogs.input.yourDeck">Your deck</T></Label>
                <AddArchetype archetype={archetype} setArchetype={setArchetype} />
                
                <Label><T id="battleLogs.input.opponentsDeck">Opponent&apos;s Deck</T></Label>
                <AddArchetype archetype={oppArchetype} setArchetype={setOppArchetype} />

                <Label><T id="battleLogs.input.format">Format</T></Label>
                  <Select value={format} onValueChange={(value) => setFormat(value as LogFormats)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={gt("Select format", { $id: "common.selectFormat" })} />
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
              <Label><T id="battleLogs.input.result">Result:</T> {parsedLogDetails.result}</Label>
            </>
            )
          )}
          <DialogFooter className="mt-4">
            <Button variant="secondary" onClick={() => setShowDialog(false)}><T id="common.close">Close</T></Button>
            <Button onClick={handleAddButtonClick}><T id="common.confirm">Confirm</T></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
