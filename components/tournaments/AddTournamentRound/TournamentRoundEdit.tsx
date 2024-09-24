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
  editing: boolean;
  setEditing: (editing: boolean) => void;

  tournamentId: string;
  userId: string;
  editedRoundNumber: number;
  existingRound?: Database['public']['Tables']['tournament rounds']['Row'];
  updateClientRounds: (newRound: Database['public']['Tables']['tournament rounds']['Row']) => void
}

export default function TournamentRoundEdit(props: TournamentRoundEditProps) {
  const { toast } = useToast();

  const [deck, setDeck] = useState<string | undefined>(undefined);
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

  useEffect(() => {
    setDeck(props.existingRound?.deck ?? undefined)
  }, [props.existingRound?.deck]);

  useEffect(() => {
    setResult(props.existingRound?.result ?? [])
  }, [props.existingRound?.result]);

  useEffect(() => {
    if (props.existingRound?.match_end_reason) {
      setImmediateMatchEnd(props.existingRound.match_end_reason as ImmediateMatchEndScenarios)
    }
  }, [props.existingRound?.match_end_reason])

  const handleRoundEdit = useCallback(async () => {
    const supabase = createClient();
    let data, error;

    const payload = {
      tournament: props.tournamentId,
      round_num: props.editedRoundNumber,
      result: result,
      deck: deck,
      user: props.userId,
      match_end_reason: immediateMatchEnd ?? null
    };

    if (props.existingRound) {
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
      props.setEditing(false);
      setImmediateMatchEnd(undefined);
      props.updateClientRounds(data[0]);
    }
  }, [props.tournamentId, deck, result, immediateMatchEnd, props.setEditing]);

  if (props.editing) return (
    <Card>
      <CardHeader>
        <CardTitle className="my-2 flex justify-between items-center">
          <span>Round {props.editedRoundNumber}</span>
          <ToggleGroup type='single' variant='outline' value={immediateMatchEnd} onValueChange={(value) => {
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
          <AddArchetype defaultArchetype={props.existingRound?.deck ?? undefined} setArchetype={setDeck} isDisabled={immediateMatchEnd !== undefined} />
          <RoundResultInput result={result} setResult={setResult} isMatchImmediatelyEnded={!!immediateMatchEnd} />
          <div className="grid grid-cols-3 gap-2">
            <Button className='col-span-2' onClick={handleRoundEdit} type="submit" disabled={((immediateMatchEnd === undefined) && (!deck || (result.length === 0)))}>{props.existingRound ? 'Update round' : 'Add round'}</Button>
            <Button variant='secondary' onClick={() => props.setEditing(false)}>Cancel</Button>
          </div>
      </div>
      </CardHeader>
    </Card>
  )

  return (
    <Button size='sm' variant={'outline'} onClick={() => props.setEditing(true)}>
      {props.existingRound && <><Upload className="mr-2 h-4 w-4" />Update round</>}
      {!props.existingRound && <><Plus className="mr-2 h-4 w-4" />Add round</>}
    </Button>
  )
}