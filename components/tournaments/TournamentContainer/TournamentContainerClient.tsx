'use client';

import { Database } from "@/database.types"
import TournamentRoundList from "../TournamentRoundList";
import { User } from "@supabase/supabase-js";
import AddTournamentRound from "../AddTournamentRound/AddTournamentRound";
import { format } from "date-fns";
import { useCallback, useState } from "react";
import { EditableTournamentArchetype } from "@/components/archetype/AddArchetype/AddTournamentArchetype";
import { displayTournamentDate, getRecord } from "../utils/tournaments.utils";

interface TournamentContainerClientProps {
  tournament: Database['public']['Tables']['tournaments']['Row'];
  rounds: Database['public']['Tables']['tournament rounds']['Row'][];
  user: User | undefined | null;
}

export const TournamentContainerClient = (props: TournamentContainerClientProps) => {
  const [rounds, setRounds] = useState(props.rounds);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateClientRoundsOnAdd = useCallback((newRound: Database['public']['Tables']['tournament rounds']['Row']) => {
    setIsUpdating(true);
    setTimeout(() => {
      setRounds((prevRounds) => [...prevRounds, newRound]);
      setIsUpdating(false);
    }, 500);
  }, []);

  return (
    <div className="flex-1 flex flex-col w-full h-full p-8 sm:max-w-xl justify-between gap-2">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-7 items-center">
          <div className="flex flex-col gap-1 col-span-5">
            <h1 className="scroll-m-20 text-2xl font-bold tracking-tight">{props.tournament.name}</h1>
            <h3 className="text-sm text-muted-foreground">{displayTournamentDate(props.tournament.date_from, props.tournament.date_to)}</h3>
          </div>
          <EditableTournamentArchetype tournament={props.tournament} />
          <h2 className={`text-xl font-semibold tracking-wider transition-opacity duration-500 ${isUpdating ? 'opacity-0' : 'opacity-100'}`}>{getRecord(rounds)}</h2>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            <TournamentRoundList rounds={rounds} />
            {props.user?.id && (props.user.id === props.tournament.user) && (
              <AddTournamentRound
                tournamentId={props.tournament.id}
                userId={props.user.id}
                roundsLength={rounds.length}
                updateClientRoundsOnAdd={updateClientRoundsOnAdd}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
