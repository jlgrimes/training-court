import TournamentContainer from "@/components/tournaments/TournamentContainer/TournamentContainer";
import { fetchTournament } from "@/components/tournaments/utils/tournaments.server.utils";
import { fetchCurrentUser } from "@/components/auth.utils";
import { redirect } from "next/navigation";
import { TOURNAMENT_CONFIGS } from "@/lib/tournaments/config";
import { fetchPreferredGames } from "@/components/user-data.utils";
import { isGameEnabled } from "@/lib/game-preferences";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const tournamentData = await fetchTournament(params.id, TOURNAMENT_CONFIGS['pokemon-pocket']);

  return {
    title: tournamentData?.name ?? 'A tournament'
  };
}

export default async function PocketTournamentPage({ params }: { params: { id: string } }) {
  const tournamentData = await fetchTournament(params.id, TOURNAMENT_CONFIGS['pokemon-pocket']);
  const user = await fetchCurrentUser();

  if (!user) {
    return redirect("/");
  }

  const preferredGames = await fetchPreferredGames(user.id);
  if (!isGameEnabled(preferredGames, 'pokemon-pocket')) {
    return redirect('/preferences');
  }

  if (!tournamentData) {
    return redirect("/pocket/tournaments");
  }

  return (
    <TournamentContainer tournament={tournamentData} config={TOURNAMENT_CONFIGS['pokemon-pocket']} />
  );
}
