'use client';


import { createClient } from "@/utils/supabase/client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { getCookie, setCookie } from 'typescript-cookie';

const getLocalDeckCookieKey = (tournamentId: string) => `buddy-poffin__local-deck-for-${tournamentId}`

export const EditableTournamentArchetype = ({ tournament, editDisabled }: { tournament: Database['public']['Tables']['tournaments']['Row'], editDisabled?: boolean }) => {
  const [deck, setDeck] = useState('');
  const [serverDeck, setServerDeck] = useState(tournament.deck);
  const [clientDeck, setClientDeck] = useState(getCookie(getLocalDeckCookieKey(tournament.id)));

  const shouldLocalizeDeckInput = useMemo(() => {
    if (isAfter(Date.now(), tournament.date_to)) return false;
    return true;
  }, [tournament.date_to]);

  useEffect(() => {
    if (clientDeck && !shouldLocalizeDeckInput) {
      setArchetype();
    }
  }, [clientDeck]);
  
  const setArchetype = useCallback(async () => {
    if (shouldLocalizeDeckInput) {
      setCookie(getLocalDeckCookieKey(tournament.id), deck);
      return setClientDeck(deck);
    }

    const supabase = createClient();
    
    const { error } = await supabase.from('tournaments').update({ deck }).eq('id', tournament.id);

    if (error) throw error;

    setServerDeck(deck);
  }, [createClient, deck]);

  if (clientDeck) {
    return (
      <div>
        <Sprite name={clientDeck} faded /> 
      </div>
    )
  }

  if (serverDeck) {
    return (
      <div>
        <Sprite name={serverDeck} /> 
      </div>
    )
  }

  if (editDisabled) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger className="text-sm">Add deck</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add your deck for {tournament.name}</DialogTitle>
        </DialogHeader>
          <AddArchetype setArchetype={setDeck} />
          {shouldLocalizeDeckInput && (
            <p className="my-0 text-sm">
              Adding your deck before the tournament is over will be localized, and not uploaded to the cloud until after the tournament is over.
              This is to preserve the integrity of the tournament for all participants.
            </p>
          )}
          <DialogClose asChild>
            <Button disabled={deck.length === 0} onClick={setArchetype}>Save</Button>
          </DialogClose>
      </DialogContent>
    </Dialog>
  );
}