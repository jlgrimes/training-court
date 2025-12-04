import { User } from "@supabase/supabase-js";
import PocketTournamentCreate from "./PocketTournamentCreate";
import { MyPocketTournamentPreviews } from "./Preview/MyPocketTournamentPreviews";
import { Header } from "@/components/ui/header";
import { POCKET_TOURNAMENT_CONFIG } from "@/components/tournaments/utils/tournament-game-config";
import { userAgent } from "next/server";
import TournamentCreateDialog from "@/components/tournaments/TournamentCreate";

interface PocketTournamentsHomePageProps {
  user: User;
}

export const PocketTournamentsHomePage = async (props: PocketTournamentsHomePageProps) => {
  return (
    <div className="flex flex-col gap-4">
      <Header
        description="Record your Pocket tournaments, rounds, and matchups"
      >
        Pocket Tournaments
      </Header>
      <TournamentCreateDialog userId={props.user.id} config={POCKET_TOURNAMENT_CONFIG} />
      <MyPocketTournamentPreviews user={props.user} />
    </div>
  );
}
