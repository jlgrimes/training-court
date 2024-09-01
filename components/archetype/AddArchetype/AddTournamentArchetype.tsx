'use client';


import { createClient } from "@/utils/supabase/client";
import React, { useCallback, useState } from "react";
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

export const EditableTournamentArchetype = ({ tournament }: { tournament: Database['public']['Tables']['tournaments']['Row']}) => {
  const [deck, setDeck] = useState('');
  const [serverDeck, setServerDeck] = useState(tournament.deck);
  
  const setArchetype = useCallback(async () => {
    const supabase = createClient();
    
    const { error } = await supabase.from('tournaments').update({ deck }).eq('id', tournament.id);

    if (error) throw error;

    setServerDeck(deck);
  }, [createClient, deck]);

  if (serverDeck) {
    return (
      <div>
        <Sprite name={serverDeck} /> 
      </div>
    )
  }

  return (
    <Dialog>
      <DialogTrigger>Add deck</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add your deck for {tournament.name}</DialogTitle>
        </DialogHeader>
          <AddArchetype setArchetype={setDeck} />
          <DialogClose asChild>
            <Button disabled={deck.length === 0} onClick={setArchetype}>Save</Button>
          </DialogClose>
      </DialogContent>
    </Dialog>
  );
}