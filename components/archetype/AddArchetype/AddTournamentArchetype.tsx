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
} from "@/components/ui/dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Database } from "@/database.types";
import { isAfter } from "date-fns";
import { getCookie, setCookie, removeCookie } from 'typescript-cookie';
import { tournamentState } from "@/components/atoms/tournamentAtoms";
import { useRecoilState, useRecoilValue } from "recoil";
import { tournamentDeckState } from "@/components/atoms/tournamentAtoms";

const getLocalDeckCookieKey = (tournamentId: string) => `buddy-poffin__local-deck-for-${tournamentId}`;

interface EditableTournamentArchetypeProps {
  tournament?: Database['public']['Tables']['tournaments']['Row'];
  editDisabled?: boolean;
}

export const EditableTournamentArchetype = ({ tournament, editDisabled }: EditableTournamentArchetypeProps) => {
  const recoilTournament = useRecoilValue(tournamentState);
  const activeTournament = tournament || recoilTournament;
  
  const [serverDeck, setServerDeck] = useRecoilState(tournamentDeckState(activeTournament.id));

  const [clientDeck, setClientDeck] = useState<string | undefined>();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const shouldLocalizeDeckInput = useMemo(() => {
    return !isAfter(Date.now(), activeTournament.date_to);
  }, [activeTournament.date_to]);

  useEffect(() => {
    const localDeck = getCookie(getLocalDeckCookieKey(activeTournament.id));
    
    if (!serverDeck && localDeck) {
      setClientDeck(localDeck);
    } else {
      setClientDeck(serverDeck);
    }
  }, [activeTournament.id, serverDeck]);

  useEffect(() => {
    if (clientDeck && !shouldLocalizeDeckInput) {
      removeCookie(getLocalDeckCookieKey(activeTournament.id));
      setArchetype(clientDeck);
    }
  }, [clientDeck, shouldLocalizeDeckInput]);

  const setArchetype = useCallback(async (deck: string) => {
    if (shouldLocalizeDeckInput) {
      setCookie(getLocalDeckCookieKey(activeTournament.id), deck, { expires: 70 });
      setClientDeck(deck);
    } else {
      const supabase = createClient();
      const { error } = await supabase.from('tournaments').update({ deck }).eq('id', activeTournament.id);

      if (error) throw error;

      setServerDeck(deck);
    }
  }, [activeTournament.id, shouldLocalizeDeckInput, setServerDeck]);

  if (clientDeck && !isDialogOpen) {
    return (
      <HoverCard>
        <HoverCardTrigger className="cursor-pointer" onClick={() => setIsDialogOpen(true)}>
          <Sprite name={clientDeck} faded />
        </HoverCardTrigger>
        <HoverCardContent>
          Archetype will be stored on this device until the tournament is over, then it will be automatically uploaded to the cloud.
        </HoverCardContent>
      </HoverCard>
    );
  }

  if (editDisabled) {
    if (serverDeck) {
      return <Sprite name={serverDeck} />;
    }
    return null;
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger className="text-sm">
        {serverDeck ? <Sprite name={serverDeck} /> : 'Add deck'}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add your deck for {activeTournament.name}</DialogTitle>
        </DialogHeader>
        <AddArchetype archetype={clientDeck || ''} setArchetype={setClientDeck} />
        {shouldLocalizeDeckInput && (
          <p className="my-0 text-sm">
            Adding your deck before the tournament is over will be saved locally and not uploaded to the cloud until after the tournament is over.
            This is to preserve the integrity of the tournament for all participants.
          </p>
        )}
        <DialogClose asChild>
          <Button disabled={!clientDeck} onClick={() => {
            setArchetype(clientDeck || '');
            setIsDialogOpen(false);
          }}>Save</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};
