import { TournamentPageClient } from "@/components/tournaments/TournamentContainer/TournamentPageClient";
import { fetchRounds, fetchTournament } from "@/components/tournaments/utils/tournaments.server.utils";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { validate as isUuid } from "uuid";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  if (!isUuid(params.id)) notFound();
  const tournamentData = await fetchTournament(params.id);

  return {
    title: tournamentData?.name ?? 'A tournament'
  };
}

export default async function TournamentPage({ params }: { params: { id: string } }) {
  if (!isUuid(params.id)) notFound();
  const [tournament, rounds] = await Promise.all([
    fetchTournament(params.id),
    fetchRounds(params.id),
  ]);

  return (
    <TournamentPageClient
      tournamentId={params.id}
      game='ptcg'
      redirectTo='/'
      initialTournament={tournament}
      initialRounds={rounds ?? []}
    />
  );
}
