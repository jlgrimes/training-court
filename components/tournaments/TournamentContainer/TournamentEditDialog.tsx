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
import { tournamentFormats, TournamentFormats } from "../Format/tournament-format.types";

interface TournamentEditDialogProps {
  tournamentId: string;
  tournamentName: string;
  tournamentCategory: TournamentCategory | null;
  tournamentPlacement: TournamentPlacement | null;
  tournamentDateRange: DateRange;
  tournamentFormat: TournamentFormats | null;
  user: User | null;
  updateClientTournament: (newName: string, newDateRange: DateRange, newCategory: TournamentCategory | null, newPlacement: TournamentPlacement | null, newFormat: TournamentFormats | null) => void;
}

export const TournamentEditDialog = (props: TournamentEditDialogProps) => {
  const { toast } = useToast();

  const [tournamentName, setTournamentName] = useState('');
  const [tournamentDate, setTournamentDate] = useState<DateRange | undefined>();
  const [tournamentCategory, setTournamentCategory] = useState<TournamentCategory | null>(null);
  const [tournamentPlacement, setTournamentPlacement] = useState<TournamentPlacement | null>(null);
  const [tournamentFormat, setTournamentFormat] = useState<TournamentFormats | null>(null);

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
      <DialogTrigger asChild>
        <Button variant='ghost' size='icon' className="w-8 h-8">
          <Pencil className="h-4 w-4" color="gray" />
        </Button>
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

            <Select value={tournamentFormat ? (tournamentFormat as string) : undefined} onValueChange={(value) => setTournamentFormat(value as TournamentFormats)}>
              {/* <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger> */}
              <SelectContent>
                {tournamentFormats.map((format) => (
                  <SelectItem key={format} value={format}>
                    {format}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <SelectContent>
              {allTournamentCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
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