import { fetchPocketTournament, fetchPocketRounds } from "./utils/pocket-tournaments.server.utils";
import { fetchCurrentUser } from "@/components/auth.utils";
import { redirect } from "next/navigation";
import { TournamentContainerClient } from "@/components/tournaments/TournamentContainer/TournamentContainerClient";
import { Database } from "@/database.types";
import { POCKET_TOURNAMENT_CONFIG } from "@/components/tournaments/utils/tournament-game-config";

const mapTournament = (t: any): Database['public']['Tables']['tournaments']['Row'] => ({
  ...t,
});

const mapRound = (r: any): Database['public']['Tables']['tournament rounds']['Row'] => ({
  ...r,
});

export default async function PocketTournamentContainer({ tournamentId }: { tournamentId: string }) {
  // Fetch all data in parallel
  const [tournamentData, user, rounds] = await Promise.all([
    fetchPocketTournament(tournamentId),
    fetchCurrentUser(),
    fetchPocketRounds(tournamentId),
  ]);

  if (!tournamentData) {
    return redirect("/pocket/tournaments");
  }

  return (
    <TournamentContainerClient
      tournament={mapTournament(tournamentData)}
      user={user}
      rounds={(rounds ?? []).map(mapRound)}
      config={POCKET_TOURNAMENT_CONFIG}
    />
  );
}
