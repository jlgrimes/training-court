import { Metadata } from "next";
import { TournamentPageClient } from "@/components/tournaments/TournamentContainer/TournamentPageClient";
import { fetchPocketRounds, fetchPocketTournament } from "@/components/pocket/tournaments/utils/pocket-tournaments.server.utils";
import type { Database } from "@/database.types";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const tournamentData = await fetchPocketTournament(params.id);

  return {
    title: tournamentData?.name ?? 'A Pocket tournament'
  };
}

export default async function PocketTournamentPage({ params }: { params: { id: string } }) {
  const [tournament, rounds] = await Promise.all([
    fetchPocketTournament(params.id),
    fetchPocketRounds(params.id),
  ]);

  return (
    <TournamentPageClient
      tournamentId={params.id}
      game='pocket'
      redirectTo='/pocket/tournaments'
      initialTournament={tournament as Database['public']['Tables']['tournaments']['Row'] | null}
      initialRounds={(rounds ?? []) as Database['public']['Tables']['tournament rounds']['Row'][]}
    />
  );
}
