'use client';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "../../ui/label"
import { useCallback, useEffect, useState } from "react"
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "../../ui/use-toast";
import { Pencil, Trash } from "lucide-react";
import { DateRange } from "react-day-picker";
import { DatePicker } from "@/components/ui/date-picker";

const Bugs = {
  BattleLogs: {
    MissingDeck: 'missing-deck',
    WrongDeck: 'wrong-deck',
    ImportingDeck: 'importing-deck',
    FeatureRequest: 'feature-request',
    Other: 'other'
  },
  Tournaments: {
    VisualGlitch: 'visual-glitch',
    FeatureRequest: 'feature-request',
    Other: 'other'
  }
}

interface TournamentDeleteDialogProps {
  tournamentId: string;
  tournamentName: string;
}

export const TournamentDeleteDialog = (props: TournamentDeleteDialogProps) => {
  const { toast } = useToast();
  
  const handleDeleteTournament = useCallback(async () => {
    const supabase = createClient();
    const { error: roundErr } = await supabase.from('tournament rounds').delete().eq('tournament', props.tournamentId);

    if (roundErr) {
      return toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong with deleting rounds.",
        description: roundErr.message,
      })
    }

    const { error } = await supabase.from('tournaments').delete().eq('id', props.tournamentId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong with deleting the tournament.",
        description: error.message,
      })
    } else {
      window.location.href = '/home';
    }
  }, [toast]);

  return (
    <Dialog>
      <DialogTrigger>
        <Button variant='outline' size='sm'><Trash className="h-4 w-4 mr-2" />Delete</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete tournament</DialogTitle>
        </DialogHeader>
          <p>
            Are you sure you want to delete tournament <b>{props.tournamentName}</b>?
          </p>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant={'secondary'}>Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant={'destructive'} onClick={handleDeleteTournament}>Yes, delete</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}