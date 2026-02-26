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
import { Database } from "@/database.types";
import { isAfter } from "date-fns";
import { getCookie, setCookie, removeCookie } from 'typescript-cookie';

const getLocalDeckCookieKey = (tournamentId: string) => `buddy-poffin__local-deck-for-${tournamentId}`

export const EditableTournamentArchetype = ({ tournament, editDisabled, tableName = 'tournaments', hatType }: { tournament: Database['public']['Tables']['tournaments']['Row'], editDisabled?: boolean; tableName?: string; hatType?: string | null }) => {
  const [deck, setDeck] = useState('');
  const [serverDeck, setServerDeck] = useState(tournament.deck);
  const [clientDeck, setClientDeck] = useState<string | undefined>();

  const shouldLocalizeDeckInput = useMemo(() => {
    if (isAfter(Date.now(), tournament.date_to)) return false;
    return true;
  }, [tournament.date_to]);

  useEffect(() => {
    setClientDeck(getCookie(getLocalDeckCookieKey(tournament.id)));
  }, [tournament.id]);

  const setArchetype = useCallback(async (deck: string) => {
    if (shouldLocalizeDeckInput) {
      setCookie(getLocalDeckCookieKey(tournament.id), deck, { expires: 70 });
      return setClientDeck(deck);
    }

    const supabase = createClient();

    const { error } = await supabase.from(tableName).update({ deck }).eq('id', tournament.id);

    if (error) throw error;

    setServerDeck(deck);
  }, [shouldLocalizeDeckInput, tableName, tournament.id]);

  useEffect(() => {
    if (clientDeck && !shouldLocalizeDeckInput) {
      removeCookie(getLocalDeckCookieKey(tournament.id));
      setArchetype(clientDeck);
    }
  }, [clientDeck, shouldLocalizeDeckInput, setArchetype, tournament.id]);

  useEffect(() => {
    if (clientDeck) {
      setDeck(clientDeck);
      return;
    }

    if (serverDeck) {
      setDeck(serverDeck);
    }
  }, [clientDeck, serverDeck]);

  if (editDisabled) {
    if (serverDeck) {
      return <Sprite name={serverDeck} hatType={hatType ?? undefined} />
    }
    return null;
  }

  const displayDeck = clientDeck ?? serverDeck;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {displayDeck ? (
          <Button variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent" aria-label="Edit deck">
            <Sprite name={displayDeck} hatType={hatType ?? undefined} />
          </Button>
        ) : (
          <Button variant="secondary" size="sm">Add deck</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{displayDeck ? `Edit your deck for ${tournament.name}` : `Add your deck for ${tournament.name}`}</DialogTitle>
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
