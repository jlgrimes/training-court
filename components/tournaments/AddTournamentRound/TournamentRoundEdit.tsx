'use client';

import { useCallback, useEffect, useState } from "react";
import { Button } from "../../ui/button";
import { Card, CardHeader, CardTitle } from "../../ui/card";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "../../ui/use-toast";
import { AddArchetype } from "../../archetype/AddArchetype/AddArchetype";
import { GhostIcon, HandshakeIcon, Plus, Upload } from "lucide-react";
import { RoundResultInput } from "./RoundResultInput";
import { Database } from "@/database.types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type ImmediateMatchEndScenarios = 'ID' | 'No show';

export interface TournamentRoundEditProps {
  tournamentId: string;
  userId: string;
  editedRoundNumber: number;
  shouldUpdate: boolean;
  updateClientRounds: (newRound: Database['public']['Tables']['tournament rounds']['Row']) => void
}

export default function TournamentRoundEdit(props: TournamentRoundEditProps) {
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

  const handleRoundEdit = useCallback(async () => {
    const supabase = createClient();
    let data, error;

    const payload = {
      tournament: props.tournamentId,
      round_num: props.editedRoundNumber,
      result: result,
      deck: deck,
      user: props.userId,
      is_id: immediateMatchEnd === 'ID'
    };

    if (props.shouldUpdate) {
      const res = await supabase.from('tournament rounds').update(payload).eq('tournament', props.tournamentId).eq('round_num', props.editedRoundNumber).select().returns<Database['public']['Tables']['tournament rounds']['Row'][]>();

      data = res.data;
      error = res.error
    } else {
      const res = await supabase.from('tournament rounds').insert(payload).select().returns<Database['public']['Tables']['tournament rounds']['Row'][]>();

      data = res.data;
      error = res.error
    }

    if (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message,
      })
    } else if (data) {
      setResult([]);
      setEditing(false);
      setImmediateMatchEnd(undefined);
      props.updateClientRounds(data[0]);
    }
  }, [props.tournamentId, deck, result, immediateMatchEnd]);

  if (editing) return (
    <Card>
      <CardHeader>
        <CardTitle className="my-2 flex justify-between items-center">
          <span>Round {props.editedRoundNumber}</span>
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
          <Button onClick={handleRoundEdit} type="submit" disabled={((immediateMatchEnd === undefined) && (!deck || (result.length === 0)))}>Add round</Button>
      </div>
      </CardHeader>
    </Card>
  )

  return (
    <Button size='sm' variant={'outline'} onClick={() => setEditing(true)}>
      {props.shouldUpdate && <><Upload className="mr-2 h-4 w-4" />Update round</>}
      {!props.shouldUpdate && <><Plus className="mr-2 h-4 w-4" />Add round</>}
    </Button>
  )
}