'use client';

import { useSetRecoilState } from 'recoil';
import { userDataAtom } from '@/app/recoil/atoms/user';
import { samePtcglUsername } from '@/lib/ptcgl-username';
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
import { DecklistSelect } from '@/components/ptcg/deckbuilder/DecklistSelect';
import { T, useGT } from 'gt-react';
import { getStoredBattleLogDecklistId, storeBattleLogDecklistId } from './BattleLogDecklistStorage';

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
  const [decklistId, setDecklistId] = useState<string | null>(null);
  const setUserData = useSetRecoilState(userDataAtom);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [needsSelection, setNeedsSelection] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const username = props.userData?.live_screen_name;
  const [lastSavedUsername, setLastSavedUsername] = useState<string>();
  useEffect(() => { setLastSavedUsername(undefined); }, [username, props.userData?.id]);

  const reviewLog = (text: string) => {
    const parsed = parseBattleLog(text, '', '', '', '', null);
    const names = parsed.players.map((player) => player.name);
    const match = names.find((name) => samePtcglUsername(name, lastSavedUsername ?? username)) ?? '';
    setPlayerNames(names);
    setSelectedPlayer(match);
    setNeedsSelection(!match);
    setParsedLogDetails(getBattleLogMetadataFromLog(parsed, match));
    setShowDialog(true);
  };

  const selectPlayer = (name: string) => {
    setSelectedPlayer(name);
    setParsedLogDetails(getBattleLogMetadataFromLog(parseBattleLog(log, '', '', '', '', null), name));
  };
  const { toast } = useToast();
  const gt = useGT();

  useEffect(() => {
    if (parsedLogDetails) {
      setArchetype(parsedLogDetails.archetype ?? '');
      setOppArchetype(parsedLogDetails.opp_archetype ?? '');
    }
  }, [parsedLogDetails]);

  useEffect(() => {
    setDecklistId(getStoredBattleLogDecklistId(props.userData?.id));
  }, [props.userData?.id]);

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = event.clipboardData.getData('Text');
    event.preventDefault();
    setLog(pastedText);

    try {
      reviewLog(pastedText);
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
    if (isSaving || !selectedPlayer || !props.userData?.id) return;
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

    const { turn_order, result } = getBattleLogMetadataFromLog(parsedLog, selectedPlayer);
    if (!result || !turn_order) return;
    setIsSaving(true);
    let saved: BattleLog;
    try {
      const { data, error } = await supabase.from('logs').insert({
        user: props.userData.id,
        archetype: archetype ?? null,
        opp_archetype: oppArchetype ?? null,
        decklist_id: decklistId,
        log,
        turn_order,
        result,
        format: format || 'Standard',
      }).select().single();
      if (error || !data) throw error ?? new Error('Import failed');
      saved = data;
    } catch (error) {
      toast({
        variant: "destructive",
        title: gt("Uh oh! Something went wrong.", { $id: "common.errorTitle" }),
        description: error instanceof Error ? error.message : String((error as { message?: string })?.message ?? error),
      });
      setIsSaving(false);
      return;
    }

    const trimmedUsername = selectedPlayer.trim();
    let usernameSaved = false;
    try {
      const { data, error } = await supabase.from('user data')
        .update({ live_screen_name: trimmedUsername })
        .eq('id', props.userData.id)
        .select('id')
        .single();
      if (error || !data) throw error ?? new Error('Preferences update failed');
      usernameSaved = true;
      setLastSavedUsername(trimmedUsername);
      setUserData((current) => current && current.id === props.userData?.id
        ? { ...current, live_screen_name: trimmedUsername }
        : !current && props.userData ? { ...props.userData, live_screen_name: trimmedUsername } : current);
    } catch {
      toast({
        variant: "destructive",
        title: gt("Your log was saved, but your username couldn't be updated. Please update it in Preferences.", { $id: "battleLogs.input.usernameUpdateFailed" }),
      });
    }

    // The log is already saved even if updating Preferences failed. Close the review
    // so retrying the username update cannot insert the same log again.
    setIsSaving(false);
    setLog('');
    setParsedLogDetails(null);
    setShowDialog(false);
    props.onLogAdded?.(saved);
    track('Import battle log');
    if (usernameSaved) toast({ title: gt("Battle log successfully imported!", { $id: "battleLogs.input.importSuccess" }) });

    if (format) Cookies.set("format", format, { expires: 30 });
  };



  return (
    <div className="relative">
      <Textarea
        className="resize-none"
        disabled={!props.userData?.id}
        placeholder={gt("Paste PTCGL log here", { $id: "battleLogs.input.placeholder" })}
        value={log}
        onPaste={handlePaste}
        onChange={(e) => setLog(e.target.value)}
      />
      {!log &&
      <Button
      size="sm"
      disabled={!props.userData?.id}
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
            reviewLog(text);
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
      
      <Dialog open={showDialog} onOpenChange={(open) => { if (!isSaving) setShowDialog(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle><T id="battleLogs.input.reviewTitle">Review Battle Log</T></DialogTitle>
            <DialogDescription>
              <T id="battleLogs.input.reviewDescription">Below is the parsed information from your battle log. Confirm to add this result to your logs.</T>
            </DialogDescription>
          </DialogHeader>
          {needsSelection && (
            <div className="space-y-2">
              <Label htmlFor="log-player"><T id="battleLogs.input.selectPlayer">Which player are you?</T></Label>
              <p className="text-sm text-muted-foreground"><T id="battleLogs.input.playerPreference">Your selected username will be saved to Preferences when you import this log.</T></p>
              <Select value={selectedPlayer} onValueChange={selectPlayer} disabled={isSaving}>
                <SelectTrigger id="log-player"><SelectValue placeholder={gt("Select your username", { $id: "battleLogs.input.selectPlayerPlaceholder" })} /></SelectTrigger>
                <SelectContent>{playerNames.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {(selectedPlayer && parsedLogDetails && (
            <>
                <Label><T id="battleLogs.input.yourDeck">Your deck</T></Label>
                <AddArchetype archetype={archetype} setArchetype={setArchetype} />

                {props.userData?.id && (
                  <>
                    <Label><T id="battleLogs.input.decklist">Decklist</T></Label>
                    <DecklistSelect
                      userId={props.userData.id}
                      value={decklistId}
                      noneLabel={gt("No decklist", { $id: "deckbuilder.noDecklist" })}
                      onChange={(decklist) => {
                        const nextDecklistId = decklist?.id ?? null;
                        setDecklistId(nextDecklistId);
                        storeBattleLogDecklistId(props.userData?.id, nextDecklistId);
                      }}
                    />
                  </>
                )}
                 
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


              <div className={`w-full rounded-md px-4 py-3 text-sm font-semibold ${
                parsedLogDetails.result === 'W'
                  ? 'bg-emerald-100 text-black dark:bg-emerald-900 dark:text-white'
                  : 'bg-red-100 text-black dark:bg-red-900 dark:text-white'
              }`}>
                <T id="battleLogs.input.result">Result:</T> {parsedLogDetails.result}
              </div>
            </>
            )
          )}
          <DialogFooter className="mt-4">
            <Button disabled={isSaving} variant="secondary" onClick={() => setShowDialog(false)}><T id="common.close">Close</T></Button>
            <Button disabled={isSaving || !selectedPlayer || !parsedLogDetails?.result} onClick={handleAddButtonClick}><T id="common.confirm">Confirm</T></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
