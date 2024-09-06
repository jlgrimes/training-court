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

export default function TournamentCreate({ userId }: { userId: string }) {
  const [editing, setEditing] = useState(false);
  const { toast } = useToast();

  const [tournamentName, setTournamentName] = useState('');
  const [tournamentDate, setTournamentDate] = useState<DateRange | undefined>();

  const handleAddTournament = useCallback(async () => {
    const supabase = createClient();
    const { error } = await supabase.from('tournaments').insert({
      name: tournamentName,
      date_from: tournamentDate?.from,
      date_to: tournamentDate?.to,
      user: userId
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message,
      })
    } else {
      toast({
        title: "You did it!",
      });
      setTournamentDate(undefined);
      setTournamentName('')
      setEditing(false);
    }
  }, [tournamentName, tournamentDate]);

  if (editing) return (
    <Card className="py-2">
      <CardHeader>
        <div className="flex flex-col w-full max-w-sm gap-2 space-x-2">
          <Input className="ml-2" placeholder="Tournament name" value={tournamentName} onChange={(e) => setTournamentName(e.target.value)} />
          <DatePicker date={tournamentDate} setDate={setTournamentDate} />
          <Button onClick={handleAddTournament} type="submit" disabled={(tournamentName.length === 0) || !tournamentDate?.from || !tournamentDate.to}>Add tournament</Button>
      </div>
      </CardHeader>
    </Card>
  )

  return (
    <Button onClick={() => setEditing(true)}><Plus className="mr-2 h-4 w-4" />Add tournament</Button>
  )
}