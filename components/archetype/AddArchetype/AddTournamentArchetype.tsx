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

const getLocalDeckCookieKey = (tournamentId: string) => `buddy-poffin__local-deck-for-${tournamentId}`

export const EditableTournamentArchetype = ({ tournament, deck, setDeck, editDisabled }: { tournament: Database['public']['Tables']['tournaments']['Row'], deck: string, setDeck: (deck: string) => void, editDisabled?: boolean }) => {
  const [clientDeck, setClientDeck] = useState<string | undefined>();

  const shouldLocalizeDeckInput = useMemo(() => {
    if (isAfter(Date.now(), tournament.date_to)) return false;
    return true;
  }, [tournament.date_to]);

  useEffect(() => {
    setClientDeck(getCookie(getLocalDeckCookieKey(tournament.id)));
  }, [tournament.id]);

  useEffect(() => {
    setClientDeck(getCookie(getLocalDeckCookieKey(tournament.id)));
  }, [tournament.id]);

  useEffect(() => {
    if (clientDeck && !shouldLocalizeDeckInput) {
      removeCookie(getLocalDeckCookieKey(tournament.id));
      setArchetype(clientDeck);
    }
  }, [clientDeck, shouldLocalizeDeckInput]);

  const setArchetype = useCallback(async (newDeck: string) => {
    if (shouldLocalizeDeckInput) {
      setCookie(getLocalDeckCookieKey(tournament.id), newDeck, { expires: 70 });
      setClientDeck(newDeck);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from('tournaments').update({ deck: newDeck }).eq('id', tournament.id);

    if (error) throw error;

    setDeck(newDeck);
  }, [shouldLocalizeDeckInput, setDeck, tournament.id]);

  if (editDisabled) {
    return deck ? <Sprite name={deck} /> : null;
  }

  if (clientDeck) {
    return (
      <HoverCard>
        <HoverCardTrigger className="cursor-pointer"><Sprite name={clientDeck} faded /> </HoverCardTrigger>
        <HoverCardContent>
          Archetype will be stored on this device until the tournament is over, then it will be automatically uploaded to the cloud.
        </HoverCardContent>
      </HoverCard>
    )
  }

  return (
    <Dialog>
      <DialogTrigger className="text-sm">{deck ? <Sprite name={deck} /> : 'Add deck'}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add your deck for {tournament.name}</DialogTitle>
        </DialogHeader>
          <AddArchetype archetype={deck} setArchetype={setDeck} />
          {shouldLocalizeDeckInput && (
            <p className="my-0 text-sm">
              Adding your deck before the tournament is over will be localized, and not uploaded to the cloud until after the tournament is over.
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