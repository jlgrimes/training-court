'use client';

import { useCallback, useEffect, useState } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Card, CardHeader, CardTitle } from "../../ui/card";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "../../ui/use-toast";
import { AddArchetype } from "../../archetype/AddArchetype/AddArchetype";
import { Toggle } from "../../ui/toggle";
import { GhostIcon, HandshakeIcon, Plus } from "lucide-react";
import { RoundResultInput } from "./RoundResultInput";
import { Database } from "@/database.types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type ImmediateMatchEndScenarios = 'ID' | 'No show';

export default function AddTournamentRound({ tournamentId, userId, roundsLength, updateClientRoundsOnAdd }: { tournamentId: string, userId: string, roundsLength: number, updateClientRoundsOnAdd: (newRound: Database['public']['Tables']['tournament rounds']['Row']) => void }) {
  const [editing, setEditing] = useState(false);
  const { toast } = useToast();

  const [deck, setDeck] = useState<string | undefined>();
  const [result, setResult] = useState<string[]>([]);
  const [immediateMatchEnd, setImmediateMatchEnd] = useState<ImmediateMatchEndScenarios | undefined>();

  useEffect(() => {
    if (immediateMatchEnd === 'ID') {
      setResult(['T']);
    } else if (immediateMatchEnd === 'No show') {
      setResult(['W']);
    } else {
      setResult([]);
    }
  }, [immediateMatchEnd]);

  const handleAddTournament = useCallback(async () => {
    const supabase = createClient();

    const { data, error } = await supabase.from('tournament rounds').insert({
      tournament: tournamentId,
      round_num: roundsLength + 1,
      result: result,
      deck: deck,
      user: userId,
      is_id: immediateMatchEnd === 'ID'
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
      setImmediateMatchEnd(undefined);
      updateClientRoundsOnAdd(data[0]);
    }
  }, [tournamentId, roundsLength, deck, result, immediateMatchEnd]);

  if (editing) return (
    <Card>
      <CardHeader>
        <CardTitle className="my-2 flex justify-between items-center">
          <span>Round {roundsLength + 1}</span>
          <ToggleGroup type='single' variant='outline' onValueChange={(value) => {
              if (value === '') return setImmediateMatchEnd(undefined);
              setImmediateMatchEnd(value as ImmediateMatchEndScenarios);
            }}>
            <ToggleGroupItem value='ID'>
              <HandshakeIcon className="mr-2 h-4 w-4" />
              ID
            </ToggleGroupItem>
            <ToggleGroupItem value='No show'>
              <GhostIcon className="mr-2 h-4 w-4" />
              No show
            </ToggleGroupItem>
          </ToggleGroup>
        </CardTitle>
        <div className="flex flex-col w-full gap-2">
          <AddArchetype setArchetype={setDeck} isDisabled={immediateMatchEnd !== undefined} />
          <RoundResultInput result={result} setResult={setResult} isMatchImmediatelyEnded={!!immediateMatchEnd} />
          <Button onClick={handleAddTournament} type="submit" disabled={((immediateMatchEnd === undefined) && (!deck || (result.length === 0)))}>Add round</Button>
      </div>
      </CardHeader>
    </Card>
  )

  return (
    <Button size='sm' variant={'outline'} onClick={() => setEditing(true)}><Plus className="mr-2 h-4 w-4" />Add round</Button>
  )
}