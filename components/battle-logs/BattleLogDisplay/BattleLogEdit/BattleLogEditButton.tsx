'use client';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { PencilIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { BattleLog, BattleLogPlayer } from "../../utils/battle-log.types";
import { AddArchetype } from "@/components/archetype/AddArchetype/AddArchetype";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogFormats, logFormats } from "@/components/tournaments/Format/tournament-format.types";

interface BattleLogEditButtonProps {
  isEditing: boolean;
  log: BattleLog;
  currentPlayer: BattleLogPlayer;
  shouldDisable: boolean;
}

export const BattleLogEditButton = (props: BattleLogEditButtonProps) => {
  const [newArchetype, setNewArchetype] = useState('');
  const [newOppArchetype, setNewOppArchetype] = useState('');
  const [newFormat, setNewFormat] = useState<LogFormats | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    setNewArchetype(props.currentPlayer.deck || '');
    setNewOppArchetype(props.currentPlayer.oppDeck || '');
    setNewFormat((props.log.format as LogFormats | null) ?? undefined);
  }, [props.currentPlayer.deck, props.currentPlayer.oppDeck, props.log.format]);
  
  const handleEditLog = useCallback(async () => {
    const supabase = createClient();
    const { error } = await supabase.from('logs').update({
      archetype: newArchetype,
      opp_archetype: newOppArchetype,
      format: newFormat ?? null
    }).eq('id', props.log.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong with updating your log.",
        description: error.message,
      })
    } else {
      window.location.href = '/ptcg/logs';
    }
  }, [toast, newArchetype, newOppArchetype, newFormat, props.log.id]);

  return (
    <Dialog>
      <DialogTrigger disabled={!props.isEditing} className={
        cn(
          "absolute right-10 transition-opacity ease-in duration-75",
          !props.isEditing && 'hidden',
        )
      }>
        <PencilIcon className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit log</DialogTitle>
        </DialogHeader>

          <Label>My deck</Label>
          <AddArchetype archetype={newArchetype} setArchetype={setNewArchetype} />

          <Label>Opponent's deck</Label>
          <AddArchetype archetype={newOppArchetype} setArchetype={setNewOppArchetype} />

          <Label>Format</Label>
          <Select value={newFormat} onValueChange={(value) => setNewFormat(value as LogFormats)}>
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

        <DialogFooter>
          <DialogClose asChild>
            <Button variant={'secondary'}>Cancel</Button>
          </DialogClose>
          <DialogClose asChild onClick={handleEditLog}>
            <Button>Apply changes</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
