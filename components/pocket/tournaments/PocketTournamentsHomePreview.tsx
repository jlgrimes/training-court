'use client'

import { Header } from "@/components/ui/header";
import PocketTournamentCreate from "./PocketTournamentCreate";
import { MyPocketTournamentPreviews } from "./Preview/MyPocketTournamentPreviews";
import { User } from "@supabase/supabase-js";
import { SeeMoreButton } from "@/components/SeeMoreButton";
import type { PocketTournament, PocketTournamentRound } from "@/lib/server/home-data";

interface PocketTournamentsHomePreviewProps {
  user: User;
  tournaments: PocketTournament[];
  rounds: PocketTournamentRound[];
}

export function PocketTournamentsHomePreview({ user, tournaments, rounds }: PocketTournamentsHomePreviewProps) {
  return (
    <div className="flex flex-col gap-4">
      <Header
        actionButton={<PocketTournamentCreate userId={user.id} />}
      >
        Pocket Tournaments
      </Header>
      <MyPocketTournamentPreviews
        user={user}
        showFilters={false}
        limit={5}
        initialTournaments={tournaments}
        initialRounds={rounds}
      />
      <SeeMoreButton href="/pocket/tournaments"/>
    </div>
  );
}
