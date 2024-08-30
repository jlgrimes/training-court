'use client';

import { useCallback, useEffect, useState } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Card, CardHeader } from "../../ui/card";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "../../ui/use-toast";
import { AddArchetype } from "../../archetype/AddArchetype/AddArchetype";
import { Toggle } from "../../ui/toggle";
import { HandshakeIcon, Plus } from "lucide-react";
import { RoundResultInput } from "./RoundResultInput";

export default function AddTournamentRound({ tournamentId, userId }: { tournamentId: string, userId: string }) {
  const [editing, setEditing] = useState(false);
  const { toast } = useToast();

  const [roundNumber, setRoundNumber] = useState<number | undefined>();
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

    const { error } = await supabase.from('tournament rounds').insert({
      tournament: tournamentId,
      round_num: roundNumber,
      result: result,
      deck: deck,
      user: userId,
      is_id: id
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
      setRoundNumber(undefined)
      setResult([]);
      setEditing(false);
    }
  }, [tournamentId, roundNumber, deck, result, id]);

  if (editing) return (
    <Card>
      <CardHeader>
        <div className="flex flex-col w-full gap-2 space-x-2">
          <div className="flex gap-2">
            <Input type='number' placeholder="Round number" value={roundNumber} onChange={(e) => setRoundNumber(parseInt(e.target.value))} />
            <Toggle variant='outline' onPressedChange={setId}>
              <HandshakeIcon className="mr-2 h-4 w-4" />
              ID
            </Toggle>
          </div>
          <AddArchetype setArchetype={setDeck} isDisabled={id} />
          <RoundResultInput result={result} setResult={setResult} />
          <Button onClick={handleAddTournament} type="submit" disabled={!roundNumber || (!id && (!deck || (result.length === 0)))}>Add round</Button>
      </div>
      </CardHeader>
    </Card>
  )

  return (
    <Button size='sm' variant={'outline'} onClick={() => setEditing(true)}><Plus className="mr-2 h-4 w-4" />Add round</Button>
  )
}