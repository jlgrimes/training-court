'use client';

import { TournamentContainerClientRecoil } from "./TournamentContainerClientRecoil";
import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Tournament } from "@/app/recoil/atoms/tournaments";
import { useTournaments } from "@/app/recoil/hooks/useTournaments";

interface TournamentContainerRecoilProps {
  tournamentId: string;
}

export default function TournamentContainerRecoil({ tournamentId }: TournamentContainerRecoilProps) {
  const { setSelectedTournament, setRounds } = useTournaments();

  useEffect(() => {
    const fetchTournamentData = async () => {
      const supabase = createClient();
      
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();

      if (tournamentError || !tournamentData) {
        console.error('Failed to fetch tournament:', tournamentError);
        return;
      }

      const { data: roundsData, error: roundsError } = await supabase
        .from('tournament rounds')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('round_num', { ascending: true });

      if (roundsError) {
        console.error('Failed to fetch rounds:', roundsError);
      }

      const tournament: Tournament = {
        id: tournamentData.id,
        name: tournamentData.name,
        deckName: tournamentData.deckname ?? '',
        deckList: tournamentData.decklist ?? undefined,
        roundsDay1: tournamentData.rounds_day_1 ?? undefined,
        roundsDay2: tournamentData.rounds_day_2 ?? undefined,
        startDate: tournamentData.date_from ?? undefined,
        endDate: tournamentData.date_to ?? undefined,
        placement: tournamentData.placement ?? undefined,
        playersCount: tournamentData.players_count ?? undefined,
        user: tournamentData.user ?? undefined,
        createdAt: tournamentData.created_at ?? undefined,
        updatedAt: tournamentData.updated_at ?? undefined,
      };

      setSelectedTournament(tournament);

      if (roundsData) {
        setRounds(roundsData.map(r => ({
          id: r.id,
          tournamentId: r.tournament_id,
          roundNumber: r.round_num ?? 0,
          opponentDeck: r.opp_archetype ?? undefined,
          win: r.win ?? undefined,
          loss: r.loss ?? undefined,
          tie: r.tie ?? undefined,
          tableName: r.table_num ?? undefined,
          day: r.day ?? undefined,
          notes: r.notes ?? undefined,
        })));
      }
    };

    fetchTournamentData();
  }, [tournamentId, setSelectedTournament, setRounds]);

  return <TournamentContainerClientRecoil tournamentId={tournamentId} />;
}