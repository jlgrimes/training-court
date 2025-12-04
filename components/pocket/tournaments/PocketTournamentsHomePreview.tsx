'use client'

import { Header } from "@/components/ui/header";
import PocketTournamentCreate from "./PocketTournamentCreate";
import { MyPocketTournamentPreviews } from "./Preview/MyPocketTournamentPreviews";
import { User } from "@supabase/supabase-js";
import { SeeMoreButton } from "@/components/SeeMoreButton";

export function PocketTournamentsHomePreview({ user }: { user: User }) {
  return (
    <div className="flex flex-col gap-4">
      <Header
        actionButton={<PocketTournamentCreate userId={user.id} />}
      >
        Pocket Tournaments
      </Header>
      <MyPocketTournamentPreviews user={user} showFilters={false} limit={5} />
      <SeeMoreButton href="/pocket/tournaments"/>
    </div>
  );
}
