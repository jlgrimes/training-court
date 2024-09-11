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
import { Pencil } from "lucide-react";
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

interface TournamentEditDialogProps {
  tournamentId: string;
  tournamentName: string;
  tournamentDateRange: DateRange;
  user: User | null;
  updateClientTournament: (newName: string, newDateRange: DateRange) => void;
}

export const TournamentEditDialog = (props: TournamentEditDialogProps) => {
  const { toast } = useToast();
  
  const [tournamentName, setTournamentName] = useState('');
  const [tournamentDate, setTournamentDate] = useState<DateRange | undefined>();

  useEffect(() => {
    setTournamentName(props.tournamentName);
  }, [props.tournamentName]);

  useEffect(() => {
    setTournamentDate(props.tournamentDateRange);
  }, [props.tournamentDateRange]);

  const handleUpdateTournament = useCallback(async () => {
    const supabase = createClient();
    const { error } = await supabase.from('tournaments').update({
      name: tournamentName,
      date_from: tournamentDate?.from,
      date_to: tournamentDate?.to,
    }).eq('id', props.tournamentId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message,
      })
    } else {
      props.updateClientTournament(tournamentName, tournamentDate as DateRange);

      toast({
        title: "Tournament changes saved.",
      });
    }
  }, [tournamentName, tournamentDate]);

  return (
    <Dialog>
      <DialogTrigger>
        <Button variant='outline' size='sm'><Pencil className="h-4 w-4 mr-2" />Edit</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit tournament</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col w-full max-w-sm gap-2 space-x-2">
          <Input className="ml-2" placeholder="Tournament name" value={tournamentName} onChange={(e) => setTournamentName(e.target.value)} />
            <DatePicker date={tournamentDate} setDate={setTournamentDate} />
        </div>
        <DialogFooter>
        <DialogClose asChild>
          <Button onClick={handleUpdateTournament} type="submit" disabled={(tournamentName.length === 0) || !tournamentDate?.from || !tournamentDate.to}>Save changes</Button>
        </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}