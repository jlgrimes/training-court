import TournamentPreview from "../Preview/TournamentPreview";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { SeeMoreButton } from "@/components/SeeMoreButton";
import { getTournamentRoundsFromUserRounds } from "../utils/tournaments.utils";
import { PTCG_TOURNAMENT_CONFIG } from "../utils/tournament-game-config";
import { Header } from "@/components/ui/header";
import TournamentCreateDialog from "../TournamentCreate";
import { fetchTournamentsServer, fetchTournamentRoundsServer } from "@/lib/server/home-data";
import { fetchCurrentUser } from "@/components/auth.utils";

/**
 * Self-contained server component widget for tournaments.
 * Fetches its own user and data - can be placed on any page.
 */
export async function TournamentsHomePreview() {
  const user = await fetchCurrentUser();
  if (!user) return null;

  // Fetch data server-side in parallel
  const [tournaments, rounds] = await Promise.all([
    fetchTournamentsServer(user.id),
    fetchTournamentRoundsServer(user.id),
  ]);

  if (tournaments.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <Header
          actionButton={<TournamentCreateDialog userId={user.id} config={PTCG_TOURNAMENT_CONFIG} />}
        >PTCG Tournaments</Header>
        <Card className="border-none">
          <CardHeader className="px-2">
            <CardDescription>You can add tournaments from the past, present, or future.</CardDescription>
            <CardDescription>Click New Tournament to get started!</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-6">
        <Header
          actionButton={<TournamentCreateDialog userId={user.id} config={PTCG_TOURNAMENT_CONFIG} />}
        >PTCG Tournaments</Header>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {tournaments.slice(0, 5).map((tournament) => (
              <TournamentPreview
                tournament={tournament}
                key={tournament.id}
                rounds={getTournamentRoundsFromUserRounds(rounds, tournament)}
                basePath={PTCG_TOURNAMENT_CONFIG.basePath}
              />
            ))}
          </div>
          <SeeMoreButton href={PTCG_TOURNAMENT_CONFIG.basePath} />
        </div>
      </div>
    </div>
  );
}
