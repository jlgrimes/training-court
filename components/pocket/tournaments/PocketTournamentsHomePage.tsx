import PocketTournamentCreate from "./PocketTournamentCreate";
import PocketTournamentImport from "./PocketTournamentImport";
import { MyPocketTournamentPreviews } from "./Preview/MyPocketTournamentPreviews";
import { Header } from "@/components/ui/header";
import { POCKET_TOURNAMENT_CONFIG } from "@/components/tournaments/utils/tournament-game-config";
import TournamentCreateDialog from "@/components/tournaments/TournamentCreate";
import { TranslatedText } from "@/components/general-translation/TranslatedText";

interface PocketTournamentsHomePageProps {
  userId: string;
}

export const PocketTournamentsHomePage = (props: PocketTournamentsHomePageProps) => {
  return (
    <div className="flex flex-col gap-4">
      <Header
        description={<TranslatedText id="pocket.tournaments.description">Record your Pocket tournaments, rounds, and matchups</TranslatedText>}
      >
        <TranslatedText id="pocket.tournaments.header">Pocket Tournaments</TranslatedText>
      </Header>
      <div className="flex flex-wrap items-center gap-2">
        <TournamentCreateDialog userId={props.userId} config={POCKET_TOURNAMENT_CONFIG} />
        <PocketTournamentImport userId={props.userId} />
      </div>
      <MyPocketTournamentPreviews userId={props.userId} />
    </div>
  );
}
