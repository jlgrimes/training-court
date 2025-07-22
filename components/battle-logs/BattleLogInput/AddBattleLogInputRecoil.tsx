'use client';

import { track } from '@vercel/analytics';
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import { AddArchetype } from '@/components/archetype/AddArchetype/AddArchetype';
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { LogFormats, logFormats } from '@/components/tournaments/Format/tournament-format.types';
import { ClipboardPaste, X } from 'lucide-react';
import Link from 'next/link';
import { useBattleLogs } from '@/app/recoil/hooks/useBattleLogs';
import { useUI } from '@/app/recoil/hooks/useUI';
import { usePreferences } from '@/app/recoil/hooks/usePreferences';
import { BattleLog } from '@/app/recoil/atoms/battle-logs';

interface AddBattleLogInputRecoilProps {
  userData: Database['public']['Tables']['user data']['Row'] | null;
}

export const AddBattleLogInputRecoil = ({ userData }: AddBattleLogInputRecoilProps) => {
  const { addBattleLog } = useBattleLogs();
  const { showSuccessToast, showErrorToast } = useUI();
  const { preferences } = usePreferences();
  
  const [log, setLog] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [format, setFormat] = useState(preferences.gameplay.defaultFormat || '');
  const [parsedLogDetails, setParsedLogDetails] = useState<{
    archetype: string | null;
    opp_archetype: string | null;
    turn_order: string | null;
    result: string | null;
  } | null>(null);
  const [archetype, setArchetype] = useState<string | undefined>();
  const [oppArchetype, setOppArchetype] = useState<string | undefined>();
  const [activeDeck, setActiveDeck] = useState<{ name: string } | null>(null);
  const username = userData?.live_screen_name;

  useEffect(() => {
    // Fetch active deck
    const fetchActiveDeck = async () => {
      if (!userData?.id) return;
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from('decks')
        .select('name')
        .eq('user_id', userData.id)
        .eq('is_active', true)
        .single();
      
      if (data && !error) {
        setActiveDeck(data);
        // Only set archetype from active deck if there's no parsed log details
        if (!parsedLogDetails) {
          setArchetype(data.name);
        }
      }
    };
    
    fetchActiveDeck();
  }, [userData?.id]);

  useEffect(() => {
    if (parsedLogDetails) {
      setArchetype(parsedLogDetails.archetype ?? '');
      setOppArchetype(parsedLogDetails.opp_archetype ?? '');
    } else if (activeDeck && !archetype) {
      // Use active deck if no parsed details and no archetype set
      setArchetype(activeDeck.name);
    }
  }, [parsedLogDetails, activeDeck]);

  const handleFileInput = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type === 'text/plain') {
            const blob = await clipboardItem.getType(type);
            const text = await blob.text();
            setLog(text);
            showSuccessToast("Pasted battle log from clipboard!");
          }
        }
      }
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
      showErrorToast("Failed to paste from clipboard. Please paste manually.");
    }
  };

  const addLogAsAdmin = async () => {
    if (!log) {
      showErrorToast("Please enter a valid battle log");
      return;
    }

    const importHash = Math.random();
    const hasLog = await checkLogExists(`${importHash}`);
    if (hasLog) {
      showErrorToast("This battle log already exists");
      return;
    }

    const supabase = createClient();
    
    // Parse the log first
    const parsedLog = parseBattleLog(log, 'temp-id', new Date().toISOString(), archetype ?? '', oppArchetype ?? '', username ?? '');
    const logMetadata = getBattleLogMetadataFromLog(parsedLog, username ?? '');
    
    if (!logMetadata) {
      showErrorToast('Invalid battle log format');
      return;
    }

    const timestamp = new Date(parsedLog.date).toISOString();

    try {
      const { data, error } = await supabase
        .from('logs')
        .insert({
          user: userData?.id ?? '',
          log,
          archetype: archetype ?? logMetadata.archetype,
          opp_archetype: oppArchetype ?? logMetadata.opp_archetype,
          format: format || undefined,
          format_search_display: (format && archetype && oppArchetype) ? `${format}+${archetype}+${oppArchetype}` : undefined,
          import_hash: `${importHash}`,
          timestamp,
          win_loss: logMetadata.result,
          went_first: logMetadata.turn_order,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const battleLog: BattleLog = {
          id: data.id,
          user: data.user,
          log: data.log,
          userDeck: data.archetype || undefined,
          oppDeck: data.opp_archetype || undefined,
          format: data.format || undefined,
          formatSearchDisplay: data.format_search_display || undefined,
          importHash: data.import_hash || undefined,
          timestamp: data.timestamp || undefined,
          winLoss: data.win_loss as 'W' | 'L' | 'T' | undefined,
          wentFirst: data.went_first || undefined,
          createdAt: data.created_at || undefined,
        };
        
        addBattleLog(battleLog);
        track('Battle log added', { 
          username: username || 'unknown', 
          archetype: archetype || 'unknown', 
          oppArchetype: oppArchetype || 'unknown', 
          format: format || 'unknown', 
          hasLog: Boolean(log) 
        });
        
        showSuccessToast('Battle log added!');
        setLog('');
        setArchetype('');
        setOppArchetype('');
        setShowDialog(false);
      }
    } catch (error) {
      console.error('Error adding log:', error);
      showErrorToast('Failed to add battle log');
    }
  };

  const checkLogExists = async (importHash: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('logs')
      .select('id')
      .eq('import_hash', importHash)
      .eq('user', userData?.id ?? '');
    
    if (error) {
      console.error('Error checking log existence:', error);
      return false;
    }
    
    return data && data.length > 0;
  };

  const handleReviewLog = () => {
    if (!log) {
      showErrorToast("Please enter a valid battle log");
      return;
    }

    try {
      const parsedLog = parseBattleLog(log, 'temp-id', new Date().toISOString(), archetype ?? '', oppArchetype ?? '', username ?? '');
      const logMetadata = getBattleLogMetadataFromLog(parsedLog, username ?? '');
      if (logMetadata) {
        setParsedLogDetails(logMetadata);
        setShowDialog(true);
      } else {
        showErrorToast('Unable to parse battle log. Please check the format.');
      }
    } catch (error) {
      showErrorToast('Unable to parse battle log. Please check the format.');
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Textarea
            placeholder="Paste your battle log here"
            value={log}
            onChange={(e) => setLog(e.target.value)}
            className="flex-1"
            rows={3}
          />
          <Button
            onClick={handleFileInput}
            variant="outline"
            size="icon"
            title="Paste from clipboard"
          >
            <ClipboardPaste className="h-4 w-4" />
          </Button>
        </div>
        
        <Button onClick={handleReviewLog} disabled={!log}>
          Review Battle Log
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Review Battle Log</DialogTitle>
            <DialogDescription>
              Confirm the details before adding this battle log.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="format" className="text-right">
                Format
              </Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {logFormats.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="archetype" className="text-right">
                Your Deck
              </Label>
              <div className="col-span-3">
                <div className="space-y-2">
                  <AddArchetype
                    archetype={archetype}
                    setArchetype={setArchetype}
                  />
                  {activeDeck && archetype === activeDeck.name && (
                    <p className="text-sm text-muted-foreground">
                      Using your active deck: {activeDeck.name}
                    </p>
                  )}
                  {!activeDeck && (
                    <p className="text-sm text-muted-foreground">
                      No active deck set.
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="oppArchetype" className="text-right">
                Opponent's Deck
              </Label>
              <div className="col-span-3">
                <AddArchetype
                  archetype={oppArchetype}
                  setArchetype={setOppArchetype}
                />
              </div>
            </div>
            
            {parsedLogDetails && (
              <div className="text-sm text-muted-foreground">
                <p>Result: {parsedLogDetails.result || 'Unknown'}</p>
                <p>Turn Order: {parsedLogDetails.turn_order ? 'Went First' : 'Went Second'}</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addLogAsAdmin}>
              Add Battle Log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};