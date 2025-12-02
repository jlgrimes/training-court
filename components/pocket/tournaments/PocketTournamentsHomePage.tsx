import { User } from "@supabase/supabase-js";
import PocketTournamentCreate from "./PocketTournamentCreate";
import { MyPocketTournamentPreviews } from "./Preview/MyPocketTournamentPreviews";
import { Header } from "@/components/ui/header";

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
      <PocketTournamentCreate userId={props.user.id} />
      <MyPocketTournamentPreviews user={props.user} />
    </div>
  );
}
