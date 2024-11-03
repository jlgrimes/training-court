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

interface MyTournamentPreviewsProps {
  user: User | null;
}

export function TournamentsHomePreview (props: MyTournamentPreviewsProps) {
  const { data: tournamentData } = useTournaments(props.user?.id);
  const { data: rounds } = useTournamentRounds(props.user?.id);

  if (!props.user) {
    return null;
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
          <Link href='/tournaments'>
            <h1 className="text-xl tracking-wide font-semibold text-slate-800">Tournaments</h1>
          </Link>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              {tournamentData?.map((tournament) => rounds && (
                <TournamentPreview tournament={tournament} key={tournament.id} rounds={getTournamentRoundsFromUserRounds(rounds, tournament)} />
              ))}
            </div>
            <SeeMoreButton href="/tournaments" />
          </div>
        </div>
      )}
      <TournamentCreate userId={props.user.id} />
    </div>
  )
  
}