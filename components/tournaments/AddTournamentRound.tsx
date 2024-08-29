'use client';

import { useCallback, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardHeader } from "../ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { createClient } from "@/utils/supabase/client";
import { useToast } from "../ui/use-toast";
import { AddArchetype } from "../archetype/AddArchetype";

export default function AddTournamentRound({ tournamentId, userId }: { tournamentId: string, userId: string }) {
  const [editing, setEditing] = useState(false);
  const { toast } = useToast();

  const [roundNumber, setRoundNumber] = useState<number | undefined>();
  const [deck, setDeck] = useState<string | undefined>();
  const [result, setResult] = useState<string[]>([]);

  const handleResultToggle = useCallback((pos: number, val: string) => {
    if (pos >= result.length) {
      return setResult([...result, val]);
    }

    if (val === '') {
      return setResult([...result.slice(0, pos)])
    }

    const newResult = [...result];
    newResult[pos] = val;

    setResult(newResult);
  }, [result, setResult]);

  const getIsToggleDisabled = useCallback((pos: number) => {
    if ((pos >= 1) && (result.length >= 1) && (result[0] === 'T')) return true;

    if (pos === 1) {
      return result.length < 1;
    } else if (pos === 2) {
      // has to be either WW or LL
      if (result[0] === result[1]) return true;
      return result.length < 2
    }
  }, [result]);

  const handleAddTournament = useCallback(async () => {
    const supabase = createClient();

    const { error } = await supabase.from('tournament rounds').insert({
      tournament: tournamentId,
      round_num: roundNumber,
      result: result,
      deck: deck,
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
      setRoundNumber(undefined)
      setEditing(false);
    }
  }, [tournamentId, roundNumber, deck, result]);

  if (editing) return (
    <Card>
      <CardHeader>
        <div className="flex flex-col w-full max-w-sm gap-2 space-x-2">
          <Input type='number' placeholder="Round number" value={roundNumber} onChange={(e) => setRoundNumber(parseInt(e.target.value))} />
          <AddArchetype setArchetype={setDeck} />
          <ToggleGroup type='single' value={result.at(0) ?? ''} onValueChange={(val) => handleResultToggle(0, val)}>
            <ToggleGroupItem value="W">W</ToggleGroupItem>
            <ToggleGroupItem value="L">L</ToggleGroupItem>
            <ToggleGroupItem value="T">T</ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup disabled={getIsToggleDisabled(1)} type='single' value={result.at(1) ?? ''} onValueChange={(val) => handleResultToggle(1, val)}>
            <ToggleGroupItem value="W">W</ToggleGroupItem>
            <ToggleGroupItem value="L">L</ToggleGroupItem>
            <ToggleGroupItem value="T" disabled>T</ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup disabled={getIsToggleDisabled(2)} type='single' value={result.at(2) ?? ''} onValueChange={(val) => handleResultToggle(2, val)}>
            <ToggleGroupItem value="W">W</ToggleGroupItem>
            <ToggleGroupItem value="L">L</ToggleGroupItem>
            <ToggleGroupItem value="T">T</ToggleGroupItem>
          </ToggleGroup>
          <Button onClick={handleAddTournament} type="submit" disabled={!roundNumber || !deck || (result.length === 0)}>Add round</Button>
      </div>
      </CardHeader>
    </Card>
  )

  return (
    <Button onClick={() => setEditing(true)}>Add round</Button>
  )
}