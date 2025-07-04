'use client';

import { useCallback, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardHeader } from "../ui/card";
import { DatePicker } from "../ui/date-picker";
import { DateRange } from "react-day-picker";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "../ui/use-toast";
import { Loader2, Plus } from "lucide-react";
import { TournamentCategory, allTournamentCategories, displayTournamentCategory } from "./Category/tournament-category.types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TournamentCategoryIcon } from "./Category/TournamentCategoryIcon";
import { TournamentPlacementSelect } from "./Placement/TournamentPlacementSelect";
import { TournamentPlacement } from "./Placement/tournament-placement.types";
import { Database } from "@/database.types";
import { TournamentFormats, tournamentFormats } from "./Format/tournament-format.types";
import { convertToUTC } from "./utils/tournaments.utils";

export default function TournamentCreate({ userId }: { userId: string }) {
  const [editing, setEditing] = useState(false);
  const [isCreatingTournament, setIsCreatingTournament] = useState(false);
  const { toast } = useToast();

  const [tournamentName, setTournamentName] = useState('');
  const [tournamentDate, setTournamentDate] = useState<DateRange | undefined>();
  const [tournamentCategory, setTournamentCategory] = useState<TournamentCategory | null>(null);
  const [tournamentPlacement, setTournamentPlacement] = useState<TournamentPlacement | null>(null);
  const [format, setFormat] = useState<TournamentFormats | null>(null);

  const handleAddTournament = useCallback(async () => {
    if (!tournamentDate?.from) return;
    setIsCreatingTournament(true);
    const supabase = createClient();

    const dateFromUTC = convertToUTC(tournamentDate.from);
    const dateToUTC = convertToUTC(tournamentDate.to ?? tournamentDate.from);

    const { data, error } = await supabase.from('tournaments').insert({
      name: tournamentName,
      date_from: dateFromUTC?.toISOString(),
      date_to: dateToUTC?.toISOString(),
      user: userId,
      category: tournamentCategory,
      placement: tournamentPlacement,
      format: format
    }).select().returns<Database['public']['Tables']['tournaments']['Row'][]>();

    if (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message,
      })
      setIsCreatingTournament(false);
    } else {
      window.location.href = `/tournaments/${data[0].id}`;
    }
  }, [tournamentName, tournamentDate, tournamentCategory, tournamentPlacement, format, userId]);

  if (editing) return (
    <Card className="py-2">
      <CardHeader>
        <div className="flex flex-col w-full max-w-sm gap-2 space-x-2">
          <Input className="ml-2" placeholder="Tournament name" value={tournamentName} onChange={(e) => setTournamentName(e.target.value)} />
          <DatePicker date={tournamentDate} setDate={setTournamentDate} />
          <Select onValueChange={(value) => setTournamentCategory(value as TournamentCategory)}>
            <SelectTrigger>
              <SelectValue placeholder="Select tournament category" />
            </SelectTrigger>
            <SelectContent>
              {allTournamentCategories.map((cat) => (
                <SelectItem value={cat} key={cat}>
                  <div className="flex items-center pl-1">
                    <TournamentCategoryIcon category={cat} />
                    <p>{displayTournamentCategory(cat)}</p>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={(val) => setFormat(val as TournamentFormats)}>
            <SelectTrigger>
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              {tournamentFormats.map((format) => (
                <SelectItem value={format} key={format}>
                  {format}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <TournamentPlacementSelect value={tournamentPlacement} onChange={(newPlacement: TournamentPlacement) => setTournamentPlacement(newPlacement)} />
          <Button onClick={handleAddTournament} type="submit" disabled={isCreatingTournament || (tournamentName.length === 0) || !tournamentDate?.from }>
            {isCreatingTournament ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Add tournament"}
          </Button>
      </div>
      </CardHeader>
    </Card>
  )

  return (
    <div className="flex flex-col w-full gap-2 space-x-2">
      <Button size='sm' onClick={() => setEditing(true)}><Plus className="mr-2 h-4 w-4" />New Tournament</Button>
    </div>
  )
}