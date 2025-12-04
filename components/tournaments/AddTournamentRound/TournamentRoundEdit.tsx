'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../../ui/button";
import { Card, CardHeader, CardTitle } from "../../ui/card";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "../../ui/use-toast";
import { AddArchetype } from "../../archetype/AddArchetype/AddArchetype";
import { GhostIcon, HandIcon, HandshakeIcon, Loader2, Plus, Upload } from "lucide-react";
import { RoundResultInput } from "./RoundResultInput";
import { Database } from "@/database.types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ImmediateMatchEndScenarios, MATCH_END_REASONS } from "../TournamentConstants/constants";
import { Label } from "@/components/ui/label";

export interface TournamentRoundEditProps {
  editing: boolean;
  setEditing: (editing: boolean) => void;

  tournamentId: string;
  userId: string;
  editedRoundNumber: number;
  existingRound?: Database['public']['Tables']['tournament rounds']['Row'];
  updateClientRounds: (newRound: Database['public']['Tables']['tournament rounds']['Row']) => void
  roundsTableName?: string;
}

export default function TournamentRoundEdit(props: TournamentRoundEditProps) {
  const { toast } = useToast();
  const roundsTable = props.roundsTableName ?? 'tournament rounds';

  const [deck, setDeck] = useState<string | undefined>(undefined);
  const [result, setResult] = useState<string[]>([]);
  const [turnOrders, setTurnOrders] = useState<string[]>([]);
  const [immediateMatchEnd, setImmediateMatchEnd] = useState<ImmediateMatchEndScenarios | null>(null);
  const [loading, setLoading] = useState(false);

  const ifChangesWereMade: boolean = useMemo(() => {
    return (props.existingRound?.deck !== deck) || (props.existingRound?.result.join() !== result.join()) || (props.existingRound.match_end_reason !== immediateMatchEnd) ||((props.existingRound?.turn_orders?.join() ?? '') !== turnOrders.join());
  }, [props.existingRound, deck, result, immediateMatchEnd, turnOrders]);

  useEffect(() => {
    if (immediateMatchEnd === MATCH_END_REASONS.ID) {
      setResult(['T']);
    } else if (immediateMatchEnd === MATCH_END_REASONS.NO_SHOW || immediateMatchEnd === MATCH_END_REASONS.BYE) {
      setResult(['W']);
    } else {
      setResult([]);
    }
  }, [immediateMatchEnd]);

  useEffect(() => {
    setDeck(props.existingRound?.deck ?? undefined)
  }, [props.existingRound?.deck]);

  useEffect(() => {
    if (props.existingRound?.match_end_reason) {
      setImmediateMatchEnd(props.existingRound.match_end_reason as ImmediateMatchEndScenarios)
    }
  }, [props.existingRound?.match_end_reason]);

  useEffect(() => {
    setResult(props.existingRound?.result ?? []);

    if (!props.existingRound?.turn_orders && props.existingRound?.result) {
      setTurnOrders(props.existingRound?.result.map((res) => ''))
    } else if (props.existingRound?.turn_orders) {
      setTurnOrders(props.existingRound.turn_orders)
    }
  }, [props.existingRound?.turn_orders, props.existingRound?.result]);

  const handleRoundEdit = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    
    const payload = {
      tournament: props.tournamentId,
      round_num: props.editedRoundNumber,
      result,
      deck,
      user: props.userId,
      match_end_reason: immediateMatchEnd ?? null,
      turn_orders: turnOrders,
    };
  
    try {
      let response;
      
      if (props.existingRound) {
        response = await supabase
          .from(roundsTable)
          .update(payload)
          .eq('tournament', props.tournamentId)
          .eq('round_num', props.editedRoundNumber)
          .select()
          .returns<Database['public']['Tables']['tournament rounds']['Row'][]>();
      } else {
        response = await supabase
          .from(roundsTable)
          .insert(payload)
          .select()
          .returns<Database['public']['Tables']['tournament rounds']['Row'][]>();
      }
  
      if (response.error) {
        throw new Error(response.error.message);
      }
  
      if (response.data?.length > 0) {
        props.updateClientRounds(response.data[0]);
        setResult([]);
        setImmediateMatchEnd(null);
        props.setEditing(false);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  }, [props.tournamentId, deck, result, immediateMatchEnd, props.setEditing, turnOrders, roundsTable]);
  

  if (props.editing) return (
    <Card>
      <CardHeader>
        <CardTitle className="my-2 flex justify-between items-center dark:text-gray-400">
          <Label>Round {props.editedRoundNumber}</Label>
        </CardTitle>
        <div className="flex flex-col w-full gap-4">
          <div className="flex flex-col w-full gap-2">
            <Label>Opponent's deck</Label>
            <AddArchetype archetype={deck} setArchetype={setDeck} isDisabled={immediateMatchEnd !== null} />
          </div>
          <div className="flex flex-col w-full gap-2">
            <RoundResultInput result={result} setResult={setResult} isMatchImmediatelyEnded={!!immediateMatchEnd} turnOrder={turnOrders} setTurnOrder={setTurnOrders} />
          </div>
          <div className="flex flex-col w-full gap-2">
            <Label>Other outcome</Label>
            <ToggleGroup className="justify-start" type='single' variant='outline' value={immediateMatchEnd ?? undefined} onValueChange={(value) => {
                if (value === '') return setImmediateMatchEnd(null);
                setImmediateMatchEnd(value as ImmediateMatchEndScenarios);
              }}>
              <ToggleGroupItem value={MATCH_END_REASONS.ID}>
                <HandshakeIcon className="mr-1 h-4 w-4" />
                {MATCH_END_REASONS.ID}
              </ToggleGroupItem>
              <ToggleGroupItem value={MATCH_END_REASONS.NO_SHOW}>
                <GhostIcon className="mr-1 h-4 w-4" />
                {MATCH_END_REASONS.NO_SHOW}
              </ToggleGroupItem>
              <ToggleGroupItem value={MATCH_END_REASONS.BYE}>
                <HandIcon className="mr-1 h-4 w-4" />
                {MATCH_END_REASONS.BYE}
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button className='col-span-2' onClick={handleRoundEdit} type="submit" disabled={loading || (!ifChangesWereMade || ((immediateMatchEnd === null) && (!deck || (result.length === 0))))}>
              {loading ? (<><Loader2 className="animate-spin mr-2 h-4 w-4 text-white" /> Saving...</>) : props.existingRound ? 'Update round' : 'Add round'}</Button>
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
