import { PocketHomePreviewClient } from './PocketHomePreviewClient';
import { fetchPocketGamesServer } from '@/lib/server/home-data';

interface PocketHomePreviewProps {
  userId: string;
}

/**
 * Self-contained server component widget for Pocket games.
 * Fetches its own data - can be placed on any page.
 */
export async function PocketHomePreview({ userId }: PocketHomePreviewProps) {
  const games = await fetchPocketGamesServer(userId);

  return (
    <PocketHomePreviewClient
      userId={userId}
      games={games}
    />
  );
}
