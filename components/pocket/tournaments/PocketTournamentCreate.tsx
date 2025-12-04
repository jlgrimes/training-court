import TournamentCreateDialog from "@/components/tournaments/TournamentCreate";
import { POCKET_TOURNAMENT_CONFIG } from "@/components/tournaments/utils/tournament-game-config";

export default function PocketTournamentCreate({ userId }: { userId: string }) {
  return <TournamentCreateDialog userId={userId} config={POCKET_TOURNAMENT_CONFIG} />;
}
