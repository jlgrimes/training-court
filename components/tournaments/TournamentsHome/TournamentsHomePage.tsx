import { User } from "@supabase/supabase-js";
import TournamentCreate from "../TournamentCreate"
import { MyTournamentPreviews } from "../Preview/MyTournamentPreviews";
import { Header } from "@/components/ui/header";
import { PTCG_TOURNAMENT_CONFIG } from "../utils/tournament-game-config";
import { TranslatedText } from "@/components/general-translation/TranslatedText";
interface TournamentsHomePageProps {
  user: User;
}

export const TournamentsHomePage = async (props: TournamentsHomePageProps) => {
  return (
    <div className="flex flex-col gap-4">
      <Header
        description={<TranslatedText id="tournaments.description">Record your TCG tournaments, rounds, and matchups</TranslatedText>}
      >
        <TranslatedText id="tournaments.header">Tournaments</TranslatedText>
      </Header>
      <TournamentCreate userId={props.user.id} config={PTCG_TOURNAMENT_CONFIG} />
      <MyTournamentPreviews user={props.user} basePath={PTCG_TOURNAMENT_CONFIG.basePath} />
    </div>
  );
}
