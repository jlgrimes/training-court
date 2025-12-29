'use client'

import { User } from "@supabase/supabase-js";
import TournamentPreview from "../Preview/TournamentPreview";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { SeeMoreButton } from "@/components/SeeMoreButton";
import { getTournamentRoundsFromUserRounds } from "../utils/tournaments.utils";
import { PTCG_TOURNAMENT_CONFIG } from "../utils/tournament-game-config";
import { Header } from "@/components/ui/header";
import TournamentCreateDialog from "../TournamentCreate";
import type { Tournament, TournamentRound } from "@/lib/server/home-data";

interface TournamentsHomePreviewProps {
  user: User;
  tournaments: Tournament[];
  rounds: TournamentRound[];
}

export function TournamentsHomePreview(props: TournamentsHomePreviewProps) {
  const { user, tournaments, rounds } = props;

  if (tournaments.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <Header
          actionButton={<TournamentCreateDialog userId={user.id} config={PTCG_TOURNAMENT_CONFIG} />}
        >PTCG Tournaments</Header>
        <Card className="border-none">
          <CardHeader className="px-2">
            <CardDescription>You can add tournaments from the past, present, or future.</CardDescription>
            <CardDescription>Click New Tournament to get started!</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-6">
        <Header
          actionButton={<TournamentCreateDialog userId={user.id} config={PTCG_TOURNAMENT_CONFIG} />}
        >PTCG Tournaments</Header>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {tournaments.slice(0, 5).map((tournament) => (
              <TournamentPreview
                tournament={tournament}
                key={tournament.id}
                rounds={getTournamentRoundsFromUserRounds(rounds, tournament)}
                basePath={PTCG_TOURNAMENT_CONFIG.basePath}
              />
            ))}
          </div>
          <SeeMoreButton href={PTCG_TOURNAMENT_CONFIG.basePath} />
        </div>
      </div>
    </div>
  );
}
