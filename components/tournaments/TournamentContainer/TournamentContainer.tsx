import { fetchCurrentUser } from "@/components/auth.utils";
import { fetchRounds, fetchTournament } from "@/components/tournaments/utils/tournaments.server.utils";
import { redirect } from "next/navigation";
import { TournamentContainerClient } from "./TournamentContainerClient";
import { TournamentTablesConfig, DEFAULT_TOURNAMENT_CONFIG } from "@/lib/tournaments/config";
import { TournamentLike, TournamentRoundLike } from "@/lib/tournaments/types";

interface TournamentContainer {
  tournament: TournamentLike;
  config?: TournamentTablesConfig;
}

export default async function TournamentContainer(props: TournamentContainer) {
  const config = props.config ?? DEFAULT_TOURNAMENT_CONFIG;
  const tournamentData = await fetchTournament(props.tournament.id, config);
  const user = await fetchCurrentUser();
  const rounds = await fetchRounds(props.tournament.id, config);

  if (!tournamentData) {
    return redirect("/");
  }

  return (
    <TournamentContainerClient
      tournament={tournamentData}
      user={user}
      rounds={(rounds ?? []) as TournamentRoundLike[]}
      config={config}
    />
  );
}
