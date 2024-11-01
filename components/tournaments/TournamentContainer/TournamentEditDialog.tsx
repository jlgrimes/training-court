'use client';

import {
  Dialog,
  DialogClose,
  DialogContent,
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
import { useCallback, useEffect, useState } from "react"
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "../../ui/use-toast";
import { Pencil } from "lucide-react";
import { DateRange } from "react-day-picker";
import { DatePicker } from "@/components/ui/date-picker";
import { TournamentCategory, allTournamentCategories, displayTournamentCategory } from "../Category/tournament-category.types";
import { TournamentCategoryIcon } from "../Category/TournamentCategoryIcon";
import { TournamentPlacement } from "../Placement/tournament-placement.types";
import { TournamentPlacementSelect } from "../Placement/TournamentPlacementSelect";
import { FormatArray, formatArray } from "../Format/tournament-format.types";

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
  tournamentCategory: TournamentCategory | null;
  tournamentPlacement: TournamentPlacement | null;
  tournamentDateRange: DateRange;
  tournamentFormat: FormatArray | null;
  user: User | null;
  updateClientTournament: (newName: string, newDateRange: DateRange, newCategory: TournamentCategory | null, newPlacement: TournamentPlacement | null, newFormat: FormatArray | null) => void;
}

export const TournamentEditDialog = (props: TournamentEditDialogProps) => {
  const { toast } = useToast();

  const [tournamentName, setTournamentName] = useState('');
  const [tournamentDate, setTournamentDate] = useState<DateRange | undefined>();
  const [tournamentCategory, setTournamentCategory] = useState<TournamentCategory | null>(null);
  const [tournamentPlacement, setTournamentPlacement] = useState<TournamentPlacement | null>(null);
  const [tournamentFormat, setTournamentFormat] = useState<FormatArray | null>(null);

  useEffect(() => {
    setTournamentName(props.tournamentName);
  }, [props.tournamentName]);

  useEffect(() => {
    setTournamentDate(props.tournamentDateRange);
  }, [props.tournamentDateRange]);

  useEffect(() => {
    setTournamentCategory(props.tournamentCategory);
  }, [props.tournamentCategory])

  useEffect(() => {
    setTournamentPlacement(props.tournamentPlacement);
  }, [props.tournamentPlacement])

  useEffect(() => {
    setTournamentFormat(props.tournamentFormat);
  }, [props.tournamentPlacement])

  const handleUpdateTournament = useCallback(async () => {
    const supabase = createClient();
    const { error } = await supabase.from('tournaments').update({
      name: tournamentName,
      date_from: tournamentDate?.from,
      date_to: tournamentDate?.to,
      category: tournamentCategory,
      placement: tournamentPlacement,
      format: tournamentFormat
    }).eq('id', props.tournamentId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message,
      })
    } else {
      props.updateClientTournament(tournamentName, tournamentDate as DateRange, tournamentCategory, tournamentPlacement, tournamentFormat);

      toast({
        title: "Tournament changes saved.",
      });
    }
  }, [tournamentName, tournamentDate, tournamentCategory, tournamentPlacement, tournamentFormat]);

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
            <Select value={tournamentCategory ? (tournamentCategory as string) : undefined} onValueChange={(value) => setTournamentCategory(value as TournamentCategory)}>
            <SelectTrigger>
              <SelectValue placeholder="Select tournament category" />
            </SelectTrigger>

            <Select value={tournamentFormat ? (tournamentFormat as string) : undefined} onValueChange={(value) => setTournamentFormat(value as FormatArray)}>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                {formatArray.map((format) => (
                  <SelectItem key={format} value={format}>
                    {format}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <SelectContent>
              {allTournamentCategories.map((cat) => (
                <SelectItem value={cat}>
                  <div className="flex items-center pl-1">
                    <TournamentCategoryIcon category={cat} />
                    <p>{displayTournamentCategory(cat)}</p>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <TournamentPlacementSelect value={tournamentPlacement} onChange={(newPlacement: TournamentPlacement) => setTournamentPlacement(newPlacement)} />
        </div>
        <DialogFooter>
        <DialogClose asChild>
          <Button onClick={handleUpdateTournament} type="submit" disabled={(tournamentName.length === 0) || !tournamentDate?.from}>Save changes</Button>
        </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}