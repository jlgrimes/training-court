import { User } from "@supabase/supabase-js";
import { PocketTournamentsHomePreviewClient } from "./PocketTournamentsHomePreviewClient";
import { fetchPocketTournamentsServer, fetchPocketTournamentRoundsServer } from "@/lib/server/home-data";

interface PocketTournamentsHomePreviewProps {
  user: User;
}

/**
 * Self-contained server component widget for Pocket tournaments.
 * Fetches its own data - can be placed on any page.
 */
export async function PocketTournamentsHomePreview({ user }: PocketTournamentsHomePreviewProps) {
  // Fetch data server-side in parallel
  const [tournaments, rounds] = await Promise.all([
    fetchPocketTournamentsServer(user.id),
    fetchPocketTournamentRoundsServer(user.id),
  ]);

  return (
    <PocketTournamentsHomePreviewClient
      user={user}
      tournaments={tournaments}
      rounds={rounds}
    />
  );
}
