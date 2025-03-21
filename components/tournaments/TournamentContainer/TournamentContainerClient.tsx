'use client';

import { Database } from "@/database.types"
import TournamentRoundList from "../TournamentRoundList";
import { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { EditableTournamentArchetype } from "@/components/archetype/AddArchetype/AddTournamentArchetype";
import { displayTournamentDateRange, getRecord } from "../utils/tournaments.utils";
import AddTournamentRound from "../AddTournamentRound/AddTournamentRound";
import { TournamentEditDialog } from "./TournamentEditDialog";
import { DateRange } from "react-day-picker";
import { parseISO } from "date-fns";
import { TournamentDeleteDialog } from "./TournamentDeleteDialog";
import { TournamentCategoryBadge } from "../Category/TournamentCategoryBadge";
import { TournamentCategory } from "../Category/tournament-category.types";
import { renderTournamentPlacement, TournamentPlacement } from "../Placement/tournament-placement.types";
import { TournamentPlacementBadge } from "../Placement/TournamentPlacementBadge";
import { preload } from "swr";
import { USE_LIMITLESS_SPRITES_KEY } from "@/components/archetype/sprites/sprites.constants";
import { fetchLimitlessSprites } from "@/components/archetype/sprites/sprites.utils";

interface TournamentContainerClientProps {
  tournament: Database['public']['Tables']['tournaments']['Row'];
  rounds: Database['public']['Tables']['tournament rounds']['Row'][];
  user: User | undefined | null;
}

export const TournamentContainerClient = (props: TournamentContainerClientProps) => {
  const [rounds, setRounds] = useState(props.rounds);
  const [tournamentName, setTournamentName] = useState(props.tournament.name);
  const [tournamentDate, setTournamentDate] = useState<DateRange>({ from: new Date( props.tournament.date_from + "T00:00:00Z"), to: new Date(props.tournament.date_to + "T00:00:00Z") });
  const [tournamentCategory, setTournamentCategory] = useState<TournamentCategory | null>(props.tournament.category as TournamentCategory | null);
  const [tournamentPlacement, setTournamentPlacement] = useState<TournamentPlacement | null>(props.tournament.placement as TournamentPlacement | null);

  useEffect(() => {
    preload(USE_LIMITLESS_SPRITES_KEY, fetchLimitlessSprites);
  }, []);

  const updateClientRoundsOnAdd = useCallback((newRound: Database['public']['Tables']['tournament rounds']['Row']) => {
    setRounds([...rounds, newRound]);
  }, [setRounds, rounds]);

  const updateClientRoundsOnEdit = useCallback((newRound: Database['public']['Tables']['tournament rounds']['Row'], pos: number) => {
    let newRounds = [...rounds];
    newRounds[pos] = newRound;
    
    setRounds(newRounds);
  }, [setRounds, rounds]);

  const updateClientTournamentDataOnEdit = useCallback((newName: string, newDate: DateRange, newCategory: TournamentCategory | null, newPlacement: TournamentPlacement | null) => {
    setTournamentDate(newDate);
    setTournamentName(newName);
    setTournamentCategory(newCategory);
    setTournamentPlacement(newPlacement)
  }, [setTournamentDate, setTournamentName, setTournamentCategory, setTournamentPlacement]);

  return (
    <div className="flex-1 flex flex-col w-full h-full px-8 py-4 sm:max-w-xl justify-between gap-2">
      <EditableTournamentArchetype
        tournament={props.tournament}
        editDisabled={props.tournament.user !== props.user?.id}
      />
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-4 sm:grid-cols-7 items-center">
          <div className="flex flex-col gap-1 col-span-2 sm:col-span-5">
            <div className="flex gap-1 items-end">
              <h1 className="scroll-m-20 text-2xl font-bold tracking-tight">{tournamentName}</h1>
              {props.user && (props.user.id === props.tournament.user) && (
                <div className="flex">
                  <TournamentEditDialog
                    tournamentId={props.tournament.id}
                    tournamentName={tournamentName}
                    tournamentDateRange={tournamentDate}
                    tournamentCategory={tournamentCategory}
                    tournamentPlacement={tournamentPlacement}
                    user={props.user}
                    updateClientTournament={updateClientTournamentDataOnEdit}
                  />
                  <TournamentDeleteDialog
                    tournamentId={props.tournament.id}
                    tournamentName={tournamentName}
                  />
                </div>
              )}
            </div>
            <h3 className="text-sm text-muted-foreground">{displayTournamentDateRange(tournamentDate)}</h3>
          </div>
          <div className="flex flex-col items-end col-span-2 gap-1 px-1">
          <h1 className="scroll-m-20 text-2xl font-bold tracking-tight">{getRecord(rounds)}</h1>
          {tournamentPlacement && <h3 className="text-sm text-muted-foreground">{renderTournamentPlacement(tournamentPlacement)}</h3>}
        </div>
      </div>        
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            <TournamentRoundList tournament={props.tournament} userId={props.user?.id} rounds={rounds} updateClientRoundsOnEdit={updateClientRoundsOnEdit} />
            {props.user?.id && (props.user.id === props.tournament.user) && (
              <AddTournamentRound
                tournamentId={props.tournament.id}
                userId={props.user.id}
                editedRoundNumber={rounds.length + 1}
                updateClientRounds={updateClientRoundsOnAdd}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}