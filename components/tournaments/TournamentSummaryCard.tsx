import {
  Card,
  CardHeader,
} from "@/components/ui/card"
import { fetchRounds, fetchTournament, getRecord } from "./utils/tournaments.utils";

import { EditableTournamentArchetype } from "../archetype/AddArchetype/AddTournamentArchetype";

export default async function TournamentSummaryCard ({ tournamentId }: { tournamentId: string }) {
  const tournament = await fetchTournament(tournamentId);
  const rounds = await fetchRounds(tournamentId);

  if (!tournament || !rounds) return null;

  return (
    <Card>
      <CardHeader className="grid grid-cols-2 gap-4 items-center">
        <EditableTournamentArchetype tournament={tournament} />
        <h2 className="text-xl font-semibold tracking-wider">{getRecord(rounds)}</h2>
      </CardHeader>
    </Card>
  )
}