import PocketTournamentCreate from "./PocketTournamentCreate";
import { MyPocketTournamentPreviews } from "./Preview/MyPocketTournamentPreviews";
import { Header } from "@/components/ui/header";
import { POCKET_TOURNAMENT_CONFIG } from "@/components/tournaments/utils/tournament-game-config";
import TournamentCreateDialog from "@/components/tournaments/TournamentCreate";

interface PocketTournamentsHomePageProps {
  userId: string;
}

export const PocketTournamentsHomePage = async (props: PocketTournamentsHomePageProps) => {
  return (
    <div className="flex flex-col gap-4">
      <Header
        description="Record your Pocket tournaments, rounds, and matchups"
      >
        Pocket Tournaments
      </Header>
      <TournamentCreateDialog userId={props.userId} config={POCKET_TOURNAMENT_CONFIG} />
      <MyPocketTournamentPreviews userId={props.userId} />
    </div>
  );
}
