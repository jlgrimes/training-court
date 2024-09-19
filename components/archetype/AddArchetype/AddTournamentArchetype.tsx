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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Database } from "@/database.types";
import { isAfter } from "date-fns";
import { getCookie, setCookie, removeCookie } from 'typescript-cookie';

const getLocalDeckCookieKey = (tournamentId: string) => `buddy-poffin__local-deck-for-${tournamentId}`;

export const EditableTournamentArchetype = ({ tournament, editDisabled }: { tournament: Database['public']['Tables']['tournaments']['Row'], editDisabled?: boolean }) => {
  const [deck, setDeck] = useState<string[]>([]);
  const [serverDeck, setServerDeck] = useState<string[] | null>(null);
  const [clientDeck, setClientDeck] = useState<string[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const shouldLocalizeDeckInput = useMemo(() => {
    return !isAfter(Date.now(), tournament.date_to);
  }, [tournament.date_to]);

  useEffect(() => {
    const savedDeck = getCookie(getLocalDeckCookieKey(tournament.id));
    if (savedDeck) {
      try {
        console.log(JSON.parse(savedDeck))
        setClientDeck(JSON.parse(savedDeck));
        console.log("Client deck " + clientDeck)
      } catch (error) {
        console.error("Error parsing saved deck from cookie: ", error);
      }
    }
    setLoading(false);
  }, [tournament.id]);

  useEffect(() => {
    if (tournament.deck) {
      try {
        const parsedDeck = typeof tournament.deck === 'string' ? JSON.parse(tournament.deck) : tournament.deck;
        setServerDeck(parsedDeck);
      } catch (error) {
        console.error("Error parsing tournament.deck: ", error);
      }
    }
  }, [tournament.deck]);

  useEffect(() => {
    if (clientDeck && !shouldLocalizeDeckInput) {
      removeCookie(getLocalDeckCookieKey(tournament.id));
      setArchetype(clientDeck);
    }
  }, [clientDeck, shouldLocalizeDeckInput, tournament.id]);

  const setArchetype = useCallback(async (newDeck: string[]) => {
    if (shouldLocalizeDeckInput) {
      setCookie(getLocalDeckCookieKey(tournament.id), JSON.stringify(newDeck), { expires: 70 });
      setClientDeck(newDeck);
    } else {
      const supabase = createClient();
      const { error } = await supabase.from('tournaments').update({ deck: newDeck }).eq('id', tournament.id);

      if (error) throw error;

      setServerDeck(newDeck);
    }
  }, [shouldLocalizeDeckInput, tournament.id]);

  // @TODO: Loading Spinner here
  if (loading) return null;

  if (editDisabled) return null;

  if (clientDeck && clientDeck.length > 0) {
    return (
      <HoverCard>
        <HoverCardTrigger className="cursor-pointer flex space-x-1">
          {clientDeck.filter(sprite => sprite !== "").map((sprite, index) => (
            <Sprite key={index} name={sprite} faded />
          ))}
        </HoverCardTrigger>
        <HoverCardContent>
          Adding your deck before the tournament is over will save it to your device only. It will not be officially uploaded until after the tournament concludes to preserve the integrity of the tournament for all participants.
        </HoverCardContent>
      </HoverCard>
    );
  }

  if (serverDeck && serverDeck.length > 0) {
    return (
      <div className="flex space-x-1">
        {serverDeck.filter(sprite => sprite !== "").map((sprite, index) => (
          <Sprite key={index} name={sprite} />
        ))}
      </div>
    );
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
            Adding your deck before the tournament is over will save it to your device only. It will not be officially uploaded until after the tournament concludes to preserve the integrity of the tournament for all participants.
          </p>
        )}
        <DialogClose asChild>
          <Button disabled={deck.length === 0} onClick={() => setArchetype(deck)}>Save</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};
