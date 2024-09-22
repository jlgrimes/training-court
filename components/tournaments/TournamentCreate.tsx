'use client';

import { useCallback, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader } from "../ui/card";
import { DatePicker } from "../ui/date-picker";
import { DateRange } from "react-day-picker";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "../ui/use-toast";
import { Plus } from "lucide-react";
import { TournamentCategory, allTournamentCategories, displayTournamentCategory } from "./Category/tournament-category.types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TournamentCategoryIcon } from "./Category/TournamentCategoryIcon";

export default function TournamentCreate({ userId }: { userId: string }) {
  const [editing, setEditing] = useState(false);
  const { toast } = useToast();

  const [tournamentName, setTournamentName] = useState('');
  const [tournamentDate, setTournamentDate] = useState<DateRange | undefined>();
  const [tournamentCategory, setTournamentCategory] = useState<TournamentCategory | null>(null);

  const handleAddTournament = useCallback(async () => {
    const supabase = createClient();
    const { error } = await supabase.from('tournaments').insert({
      name: tournamentName,
      date_from: tournamentDate?.from,
      date_to: tournamentDate?.to ?? tournamentDate?.from,
      user: userId,
      category: tournamentCategory
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message,
      })
    } else {
      // TODO: actually make this update the front end instead of refreshing the whole page
      window.location.href = '/';
    }
  }, [tournamentName, tournamentDate, tournamentCategory]);

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
                <SelectItem value={cat}>
                  <div className="flex items-center pl-1">
                    <TournamentCategoryIcon category={cat} />
                    <p>{displayTournamentCategory(cat)}</p>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddTournament} type="submit" disabled={(tournamentName.length === 0) || !tournamentDate?.from }>Add tournament</Button>
      </div>
      </CardHeader>
    </Card>
  )

  return (
    <Button onClick={() => setEditing(true)}><Plus className="mr-2 h-4 w-4" />New tournament</Button>
  )
}