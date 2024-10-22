'use client';

import { createClient } from "@/utils/supabase/client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AddArchetype } from "./AddArchetype";
import { Sprite } from "../sprites/Sprite";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Database } from "@/database.types";
import { isAfter } from "date-fns";
import { getCookie, setCookie, removeCookie } from 'typescript-cookie';
import { tournamentState } from "@/app/state/atom";
import { useRecoilState, useRecoilValue } from "recoil";
import { tournamentDeckState } from "@/components/atoms/tournamentAtoms";

const getLocalDeckCookieKey = (tournamentId: string) => `buddy-poffin__local-deck-for-${tournamentId}`;

interface EditableTournamentArchetypeProps {
  tournament: Database['public']['Tables']['tournaments']['Row'];
  editDisabled?: boolean;
}

export const EditableTournamentArchetype = ({ tournament, editDisabled }: EditableTournamentArchetypeProps) => {
  const [deck, setDeck] = useState('');
  const recoilTournament = useRecoilValue(tournamentState);
  const activeTournament = tournament || recoilTournament;
  const [serverDeck, setServerDeck] = useRecoilState(tournamentDeckState(tournament.id));
  const [clientDeck, setClientDeck] = useState<string | undefined>();

  const shouldLocalizeDeckInput = useMemo(() => {
    if (isAfter(Date.now(), activeTournament.date_to)) return false;
    return true;
  }, [activeTournament.date_to]);

  useEffect(() => {
    setClientDeck(getCookie(getLocalDeckCookieKey(activeTournament.id)));
  }, []);

  useEffect(() => {
    if (clientDeck && !shouldLocalizeDeckInput) {
      removeCookie(getLocalDeckCookieKey(activeTournament.id))
      setArchetype(clientDeck);
    }
  }, [clientDeck]);

  useEffect(() => {
    serverDeck && setDeck(serverDeck);
  }, [serverDeck]);
  
  const setArchetype = useCallback(async (deck: string) => {
    if (shouldLocalizeDeckInput) {
      setCookie(getLocalDeckCookieKey(activeTournament.id), deck, { expires: 70 });
      return setClientDeck(deck);
    }

    const supabase = createClient();
    
    const { error } = await supabase.from('tournaments').update({ deck }).eq('id', tournament?.id);

    if (error) throw error;

    setServerDeck(deck);
  }, [createClient, deck, activeTournament.id]);

  if (clientDeck) {
    return (
      <HoverCard>
        <HoverCardTrigger className="cursor-pointer"> <Sprite name={clientDeck} faded /> </HoverCardTrigger>
        <HoverCardContent>
          Archetype will be stored on this device until the tournament is over, then it will be automatically uploaded to the cloud.
        </HoverCardContent>
      </HoverCard>
    )
  }

  if (editDisabled) {
    if (serverDeck) {
      return <Sprite name={serverDeck} />
    }
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger className="text-sm">{serverDeck ? <Sprite name={serverDeck} /> : 'Add deck'}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add your deck for {activeTournament.name}</DialogTitle>
        </DialogHeader>
          <AddArchetype archetype={deck} setArchetype={setDeck} />
          {shouldLocalizeDeckInput && (
            <p className="my-0 text-sm">
              Adding your deck before the tournament is over will be saved locally and not uploaded to the cloud until after the tournament is over.
              This is to preserve the integrity of the tournament for all participants.
            </p>
          )}
          <DialogClose asChild>
            <Button disabled={deck.length === 0} onClick={() => setArchetype(deck)}>Save</Button>
          </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
