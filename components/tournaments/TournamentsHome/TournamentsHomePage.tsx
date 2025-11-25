import { User } from "@supabase/supabase-js";
import TournamentCreate from "../TournamentCreate"
import { MyTournamentPreviews } from "../Preview/MyTournamentPreviews";
import { Header } from "@/components/ui/header";
import { TournamentTablesConfig, DEFAULT_TOURNAMENT_CONFIG } from "@/lib/tournaments/config";
interface TournamentsHomePageProps {
  user: User;
  config?: TournamentTablesConfig;
}

export const TournamentsHomePage = async (props: TournamentsHomePageProps) => {
  const config = props.config ?? DEFAULT_TOURNAMENT_CONFIG;
  return (
    <div className="flex flex-col gap-4">
      <Header
        description="Record your TCG tournaments, rounds, and matchups"
      >
        Tournaments
      </Header>
      <TournamentCreate userId={props.user.id} config={config} />
      <MyTournamentPreviews user={props.user} config={config} />
    </div>
  );
}
