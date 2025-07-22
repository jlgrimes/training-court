'use client';

import TournamentCreate from "../TournamentCreate";
import { MyTournamentPreviewsRecoil } from "../Preview/MyTournamentPreviewsRecoil";
import { Header } from "@/components/ui/header";
import { useAuth } from "@/app/recoil/hooks/useAuth";

export const TournamentsHomePageRecoil = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <div>Please log in to view tournaments.</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <Header
        description="Record your TCG tournaments, rounds, and matchups"
      >
        Tournaments
      </Header>
      <TournamentCreate userId={user.id} />
      <MyTournamentPreviewsRecoil />
    </div>
  );
};