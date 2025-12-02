'use client'

import { User } from "@supabase/supabase-js";
import TournamentPreview from "../Preview/TournamentPreview";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import TournamentCreate from "../TournamentCreate";
import { SeeMoreButton } from "@/components/SeeMoreButton";
import { getTournamentRoundsFromUserRounds } from "../utils/tournaments.utils";
import { useTournaments } from "@/hooks/tournaments/useTournaments";
import { useTournamentRounds } from "@/hooks/tournaments/useTournamentRounds";
import { Skeleton } from "@/components/ui/skeleton";
import { PTCG_TOURNAMENT_CONFIG } from "../utils/tournament-game-config";
import { Header } from "@/components/ui/header";
import TournamentCreateDialog from "../TournamentCreate";

interface MyTournamentPreviewsProps {
  user: User | null;
}

export function TournamentsHomePreview (props: MyTournamentPreviewsProps) {
  const { data: tournamentData, isLoading: tournamentsAreLoading } = useTournaments(props.user?.id);
  const { data: rounds, isLoading: roundsAreLoading } = useTournamentRounds(props.user?.id);

  if (!props.user) {
    return null;
  }

  if (tournamentsAreLoading || roundsAreLoading) {
    return (
      <div className="flex flex-col gap-6">
          <Link href={PTCG_TOURNAMENT_CONFIG.basePath}>
            <h1 className="text-xl tracking-wide font-semibold">PTCG Tournaments</h1>
          </Link>
        <div className="flex flex-col gap-2">
          <Skeleton className="w-full h-[68px] rounded-xl" />
          <Skeleton className="w-full h-[68px] rounded-xl" />
          <Skeleton className="w-full h-[68px] rounded-xl" />
          <Skeleton className="w-full h-[68px] rounded-xl" />
          <Skeleton className="w-full h-[68px] rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {tournamentData && tournamentData.length === 0 ? (
        <Card className="border-none">
          <CardHeader className="px-2">
            <CardDescription>You can add tournaments from the past, present, or future.</CardDescription>
            <CardDescription>Click New Tournament to get started!</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <Header
            actionButton={<TournamentCreateDialog userId={props.user.id} config={PTCG_TOURNAMENT_CONFIG} />}
          >PTCG Tournaments</Header>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              {tournamentData?.map((tournament) => rounds && (
                <TournamentPreview
                  tournament={tournament}
                  key={tournament.id}
                  rounds={getTournamentRoundsFromUserRounds(rounds, tournament)}
                  basePath={PTCG_TOURNAMENT_CONFIG.basePath}
                />
              )).slice(0, 5)}
            </div>
            <SeeMoreButton href={PTCG_TOURNAMENT_CONFIG.basePath} />
          </div>
        </div>
      )}
    </div>
  )
  
}
