'use client';

import { useCallback, useEffect, useState } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Card, CardHeader, CardTitle } from "../../ui/card";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "../../ui/use-toast";
import { AddArchetype } from "../../archetype/AddArchetype/AddArchetype";
import { Toggle } from "../../ui/toggle";
import { HandshakeIcon, Plus } from "lucide-react";
import { RoundResultInput } from "./RoundResultInput";
import { Database } from "@/database.types";

export default function AddTournamentRound({ tournamentId, userId, roundsLength, updateClientRoundsOnAdd }: { tournamentId: string, userId: string, roundsLength: number, updateClientRoundsOnAdd: (newRound: Database['public']['Tables']['tournament rounds']['Row']) => void }) {
  const [editing, setEditing] = useState(false);
  const { toast } = useToast();

  const [deck, setDeck] = useState<string | undefined>();
  const [result, setResult] = useState<string[]>([]);
  const [id, setId] = useState(false);

  useEffect(() => {
    if (id) {
      setResult(['T']);
    } else {
      setResult([]);
    }
  }, [id]);

  const handleAddTournament = useCallback(async () => {
    const supabase = createClient();

    const { data, error } = await supabase.from('tournament rounds').insert({
      tournament: tournamentId,
      round_num: roundsLength + 1,
      result: result,
      deck: deck,
      user: userId,
      is_id: id
    }).select().returns<Database['public']['Tables']['tournament rounds']['Row'][]>();

    if (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message,
      })
    } else {
      setResult([]);
      setEditing(false);
      setId(false);
      updateClientRoundsOnAdd(data[0]);
    }
  }, [tournamentId, roundsLength, deck, result, id]);

  if (editing) return (
    <Card>
      <CardHeader>
        <CardTitle className="my-2">Round {roundsLength + 1}</CardTitle>
        <div className="flex flex-col w-full gap-4">
          <AddArchetype setArchetype={setDeck} isDisabled={id} />
          <div className="grid grid-cols-5">
            <div className="col-span-4">
            <RoundResultInput result={result} setResult={setResult} />
            </div>
            <Toggle variant='outline' onPressedChange={setId}>
              <HandshakeIcon className="mr-2 h-4 w-4" />
              ID
            </Toggle>
          </div>
          <Button onClick={handleAddTournament} type="submit" disabled={(!id && (!deck || (result.length === 0)))}>Add round</Button>
      </div>
      </CardHeader>
    </Card>
  )

  return (
    <Button size='sm' variant={'outline'} onClick={() => setEditing(true)}><Plus className="mr-2 h-4 w-4" />Add round</Button>
  )
}