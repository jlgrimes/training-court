import { createClient } from "@/utils/supabase/client";
import {
  Card,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Sprite } from "../archetype/Sprite";
import { fetchRounds, fetchTournament, getRecord } from "./tournaments.utils";
import { AddArchetype } from "../archetype/AddArchetype";
import { useCallback } from "react";
import { EditableTournamentArchetype } from "../archetype/AddTournamentArchetype";

export default async function TournamentSummaryCard ({ tournamentId }: { tournamentId: string }) {
  const tournament = await fetchTournament(tournamentId);
  const rounds = await fetchRounds(tournamentId);

  if (!tournament || !rounds) return null;

  return (
    <Card>
      <CardHeader className="grid grid-cols-4 gap-4 items-center">
        <EditableTournamentArchetype tournament={tournament} />
        <h2 className="text-xl font-semibold tracking-wider">{getRecord(rounds)}</h2>
      </CardHeader>
    </Card>
  )
}