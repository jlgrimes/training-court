'use client';


import { createClient } from "@/utils/supabase/client";
import React, { useCallback, useMemo, useState } from "react";
import { AddArchetype } from "./AddArchetype";
import { Sprite } from "../Sprite";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Database } from "@/database.types";
import { isAfter } from "date-fns";

export const EditableTournamentArchetype = ({ tournament }: { tournament: Database['public']['Tables']['tournaments']['Row']}) => {
  const [deck, setDeck] = useState('');
  const [serverDeck, setServerDeck] = useState(tournament.deck);
  
  const setArchetype = useCallback(async () => {
    const supabase = createClient();
    
    const { error } = await supabase.from('tournaments').update({ deck }).eq('id', tournament.id);

    if (error) throw error;

    setServerDeck(deck);
  }, [createClient, deck]);

  const shouldDisableDeckInput = useMemo(() => {
    if (isAfter(Date.now(), tournament.date_to)) return false;
    return true;
  }, [tournament.date_to])

  if (serverDeck) {
    return (
      <div>
        <Sprite name={serverDeck} /> 
      </div>
    )
  }

  return (
    <Dialog>
      <DialogTrigger className="text-sm">Add deck</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add your deck for {tournament.name}</DialogTitle>
        </DialogHeader>
          <AddArchetype setArchetype={setDeck} isDisabled={shouldDisableDeckInput} />
          {shouldDisableDeckInput && (
            <p className="my-0 text-sm">
              Adding your deck before the tournament is over is disabled.
              This is to preserve the integrity of the tournament
              for all participants.
            </p>
          )}
          <DialogClose asChild>
            <Button disabled={deck.length === 0 || shouldDisableDeckInput} onClick={setArchetype}>Save</Button>
          </DialogClose>
      </DialogContent>
    </Dialog>
  );
}