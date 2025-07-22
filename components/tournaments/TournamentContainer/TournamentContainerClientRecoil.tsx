'use client';

import { Database } from "@/database.types";
import TournamentRoundList from "../TournamentRoundList";
import { User } from "@supabase/supabase-js";
import { useCallback, useEffect } from "react";
import { EditableTournamentArchetype } from "@/components/archetype/AddArchetype/AddTournamentArchetype";
import { displayTournamentDate, displayTournamentDateRange, getRecord } from "../utils/tournaments.utils";
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
import { TournamentFormatBadge } from "../Format/tournamentFormatBadge";
import { TournamentFormats } from "../Format/tournament-format.types";
import { useTournaments } from "@/app/recoil/hooks/useTournaments";
import { useAuth } from "@/app/recoil/hooks/useAuth";
import { useUI } from "@/app/recoil/hooks/useUI";
import { Tournament, TournamentRound } from "@/app/recoil/atoms/tournaments";

interface TournamentContainerClientRecoilProps {
  tournamentId: string;
  initialTournament?: Database['public']['Tables']['tournaments']['Row'];
  initialRounds?: Database['public']['Tables']['tournament rounds']['Row'][];
}

export const TournamentContainerClientRecoil = ({
  tournamentId,
  initialTournament,
  initialRounds
}: TournamentContainerClientRecoilProps) => {
  const { user } = useAuth();
  const { showSuccessToast, showErrorToast } = useUI();
  const {
    selectedTournament,
    rounds,
    setSelectedTournament,
    setRounds,
    updateTournament,
    addRound,
    updateRound,
  } = useTournaments();

  // Initialize tournament data if not already in state
  useEffect(() => {
    if (initialTournament && (!selectedTournament || selectedTournament.id !== tournamentId)) {
      const tournament: Tournament = {
        id: initialTournament.id,
        name: initialTournament.name,
        deckName: initialTournament.deckname ?? '',
        deckList: initialTournament.decklist ?? undefined,
        roundsDay1: initialTournament.rounds_day_1 ?? undefined,
        roundsDay2: initialTournament.rounds_day_2 ?? undefined,
        startDate: initialTournament.date_from ?? undefined,
        endDate: initialTournament.date_to ?? undefined,
        placement: initialTournament.placement ?? undefined,
        playersCount: initialTournament.players_count ?? undefined,
        user: initialTournament.user ?? undefined,
        createdAt: initialTournament.created_at ?? undefined,
        updatedAt: initialTournament.updated_at ?? undefined,
      };
      
      setSelectedTournament(tournament);
      
      if (initialRounds) {
        const tournamentRounds: TournamentRound[] = initialRounds.map(round => ({
          id: round.id,
          tournamentId: round.tournament_id,
          roundNumber: round.round_num ?? 0,
          opponentDeck: round.opp_archetype ?? undefined,
          win: round.win ?? undefined,
          loss: round.loss ?? undefined,
          tie: round.tie ?? undefined,
          tableName: round.table_num ?? undefined,
          day: round.day ?? undefined,
          notes: round.notes ?? undefined,
        }));
        
        setRounds(tournamentRounds);
      }
    }
  }, [initialTournament, initialRounds, selectedTournament, tournamentId, setSelectedTournament, setRounds]);

  useEffect(() => {
    preload(USE_LIMITLESS_SPRITES_KEY, fetchLimitlessSprites);
  }, []);

  const updateClientRoundsOnAdd = useCallback((newRound: Database['public']['Tables']['tournament rounds']['Row']) => {
    const tournamentRound: TournamentRound = {
      id: newRound.id,
      tournamentId: newRound.tournament_id,
      roundNumber: newRound.round_num ?? 0,
      opponentDeck: newRound.opp_archetype ?? undefined,
      win: newRound.win ?? undefined,
      loss: newRound.loss ?? undefined,
      tie: newRound.tie ?? undefined,
      tableName: newRound.table_num ?? undefined,
      day: newRound.day ?? undefined,
      notes: newRound.notes ?? undefined,
    };
    
    addRound(tournamentRound);
    showSuccessToast('Round added successfully');
  }, [addRound, showSuccessToast]);

  const updateClientRoundsOnEdit = useCallback((newRound: Database['public']['Tables']['tournament rounds']['Row'], pos: number) => {
    const updates: Partial<TournamentRound> = {
      opponentDeck: newRound.opp_archetype ?? undefined,
      win: newRound.win ?? undefined,
      loss: newRound.loss ?? undefined,
      tie: newRound.tie ?? undefined,
      tableName: newRound.table_num ?? undefined,
      day: newRound.day ?? undefined,
      notes: newRound.notes ?? undefined,
    };
    
    updateRound(pos, updates);
    showSuccessToast('Round updated successfully');
  }, [updateRound, showSuccessToast]);

  const updateClientTournamentDataOnEdit = useCallback((
    newName: string,
    newDate: DateRange,
    newCategory: TournamentCategory | null,
    newPlacement: TournamentPlacement | null,
    newFormat: TournamentFormats | null
  ) => {
    if (!selectedTournament) return;
    
    updateTournament(selectedTournament.id, {
      name: newName,
      startDate: newDate.from?.toISOString(),
      endDate: newDate.to?.toISOString(),
      placement: newPlacement ? parseInt(newPlacement) : undefined,
    });
    
    showSuccessToast('Tournament updated successfully');
  }, [selectedTournament, updateTournament, showSuccessToast]);

  if (!selectedTournament) {
    return <div>Loading tournament...</div>;
  }

  const isOwner = user?.id === selectedTournament.user;
  const record = getRecord(rounds);
  const dateDisplay = selectedTournament.startDate && selectedTournament.endDate
    ? displayTournamentDateRange(selectedTournament.startDate, selectedTournament.endDate)
    : selectedTournament.startDate
    ? displayTournamentDate(selectedTournament.startDate)
    : 'No date';

  return (
    <div className="w-full flex justify-center px-4 sm:px-8">
      <div className="w-full max-w-xl flex flex-col flex-1 gap-2">
        <div className="flex flex-col gap-1">
          {isOwner && (
            <div className="flex">
              <TournamentEditDialog
                tournamentId={selectedTournament.id}
                tournamentName={selectedTournament.name}
                tournamentDateRange={{
                  from: selectedTournament.startDate ? parseISO(selectedTournament.startDate) : undefined,
                  to: selectedTournament.endDate ? parseISO(selectedTournament.endDate) : undefined,
                }}
                tournamentCategory={null}
                tournamentPlacement={selectedTournament.placement?.toString() as TournamentPlacement || null}
                tournamentFormat={null}
                user={user}
                updateClientTournament={updateClientTournamentDataOnEdit}
              />
              <TournamentDeleteDialog
                tournament={selectedTournament}
                user={user}
              />
            </div>
          )}
          
          <h1 className="text-4xl font-bold">{selectedTournament.name}</h1>
          <span className="text-lg text-muted-foreground">{dateDisplay}</span>
          
          <div className="grid grid-cols-2 pt-4 gap-4">
            <div className="flex justify-center rounded-md bg-secondary p-4">
              <EditableTournamentArchetype
                tournamentId={tournamentId}
                deckName={selectedTournament.deckName}
                canEdit={isOwner}
              />
            </div>
            
            <div className="flex flex-col items-center justify-center rounded-md bg-secondary p-4">
              <h2 className="text-3xl">{record}</h2>
              <h2 className="text-lg text-muted-foreground">Record</h2>
            </div>
            
            {selectedTournament.placement && (
              <div className="flex flex-col items-center justify-center rounded-md bg-secondary p-4">
                <TournamentPlacementBadge placement={selectedTournament.placement.toString() as TournamentPlacement} />
                <h2 className="text-3xl">{renderTournamentPlacement(selectedTournament.placement.toString() as TournamentPlacement)}</h2>
                <h2 className="text-lg text-muted-foreground">Placement</h2>
              </div>
            )}
            
            {selectedTournament.playersCount && (
              <div className="flex flex-col items-center justify-center rounded-md bg-secondary p-4">
                <h2 className="text-3xl">{selectedTournament.playersCount}</h2>
                <h2 className="text-lg text-muted-foreground">Players</h2>
              </div>
            )}
          </div>
        </div>
        
        <div className="px-2">
          <TournamentRoundList
            rounds={rounds}
            tournamentId={tournamentId}
            tournamentDeckName={selectedTournament.deckName}
            editable={isOwner}
            updateClientRoundsOnEdit={updateClientRoundsOnEdit}
          />
          
          {isOwner && <AddTournamentRound tournamentId={tournamentId} handleAddRound={updateClientRoundsOnAdd} />}
        </div>
      </div>
    </div>
  );
};