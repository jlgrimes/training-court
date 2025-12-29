import { User } from "@supabase/supabase-js";
import { TournamentsHomePreviewClient } from "./TournamentsHomePreviewClient";
import { fetchTournamentsServer, fetchTournamentRoundsServer } from "@/lib/server/home-data";

interface TournamentsHomePreviewProps {
  user: User;
}

/**
 * Self-contained server component widget for tournaments.
 * Fetches its own data - can be placed on any page.
 */
export async function TournamentsHomePreview({ user }: TournamentsHomePreviewProps) {
  // Fetch data server-side in parallel
  const [tournaments, rounds] = await Promise.all([
    fetchTournamentsServer(user.id),
    fetchTournamentRoundsServer(user.id),
  ]);

  return (
    <TournamentsHomePreviewClient
      user={user}
      tournaments={tournaments}
      rounds={rounds}
    />
  );
}
