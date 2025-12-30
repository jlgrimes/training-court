import { Header } from "@/components/ui/header";
import PocketTournamentCreate from "./PocketTournamentCreate";
import { MyPocketTournamentPreviews } from "./Preview/MyPocketTournamentPreviews";
import { SeeMoreButton } from "@/components/SeeMoreButton";
import { fetchPocketTournamentsServer, fetchPocketTournamentRoundsServer } from "@/lib/server/home-data";
import { fetchCurrentUser } from "@/components/auth.utils";

/**
 * Self-contained server component widget for Pocket tournaments.
 * Fetches its own user and data - can be placed on any page.
 */
export async function PocketTournamentsHomePreview() {
  const user = await fetchCurrentUser();
  if (!user) return null;

  // Fetch data server-side in parallel
  const [tournaments, rounds] = await Promise.all([
    fetchPocketTournamentsServer(user.id),
    fetchPocketTournamentRoundsServer(user.id),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <Header
        actionButton={<PocketTournamentCreate userId={user.id} />}
      >
        Pocket Tournaments
      </Header>
      <MyPocketTournamentPreviews
        userId={user.id}
        showFilters={false}
        limit={5}
        initialTournaments={tournaments}
        initialRounds={rounds}
      />
      <SeeMoreButton href="/pocket/tournaments"/>
    </div>
  );
}
