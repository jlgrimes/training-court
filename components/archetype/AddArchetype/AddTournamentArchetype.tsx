'use client';


import { createClient } from "@/utils/supabase/client";
import React, { useCallback, useState } from "react";
import { AddArchetype } from "./AddArchetype";
import { Sprite } from "../Sprite";
import { Button } from "../../ui/button";

export const EditableTournamentArchetype = ({ tournament }: { tournament: { id: string, deck: string }}) => {
  const [deck, setDeck] = useState('');
  
  const setArchetype = useCallback(async () => {
    const supabase = createClient();
    
    const { error } = await supabase.from('tournaments').update({ deck }).eq('id', tournament.id);

    if (error) throw error;
  }, [createClient, deck]);

  if (tournament.deck) {
    return (
      <div>
        <Sprite name={tournament.deck} /> 
      </div>
    )
  }

  return (
    <div>
      <AddArchetype setArchetype={setDeck} />
      <Button disabled={deck.length === 0} onClick={setArchetype}>Save</Button>
    </div>
  );
}