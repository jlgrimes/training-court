import { User } from "@supabase/supabase-js";
import TournamentCreate from "../TournamentCreate"
import { MyTournamentPreviews } from "../Preview/MyTournamentPreviews";
import { Header } from "@/components/ui/header";
interface TournamentsHomePageProps {
  user: User;
}

export const TournamentsHomePage = async (props: TournamentsHomePageProps) => {
  return (
    <div className="flex flex-col gap-4">
      <Header
        description="Record your TCG tournaments, rounds, and matchups"
      >
        Tournaments
      </Header>
      <TournamentCreate userId={props.user.id} />
      <MyTournamentPreviews user={props.user} />
    </div>
  );
}