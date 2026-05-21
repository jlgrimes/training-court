import { AddPocketMatch } from '@/components/pocket/AddPocketMatch';
import { Header } from '@/components/ui/header';
import { Card, CardDescription, CardHeader } from '@/components/ui/card';
import { SeeMoreButton } from '../SeeMoreButton';
import { PocketMatchesList } from './PocketMatchesList';
import { fetchPocketGamesServer } from '@/lib/server/home-data';
import { TranslatedText } from '../general-translation/TranslatedText';

interface PocketHomePreviewProps {
  userId: string;
}

/**
 * Self-contained server component widget for Pocket games.
 * Fetches its own data - can be placed on any page.
 */
export async function PocketHomePreview({ userId }: PocketHomePreviewProps) {
  const games = await fetchPocketGamesServer(userId);

  if (games.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <Header
          description={<TranslatedText id="pocket.games.description">Log your Pocket matches from home</TranslatedText>}
          actionButton={<AddPocketMatch userId={userId} />}
        >
          <TranslatedText id="pocket.games.header">Pocket Games</TranslatedText>
        </Header>
        <Card className="border-none">
          <CardHeader className="px-2">
            <CardDescription><TranslatedText id="pocket.games.empty">No Pocket games yet. Add your first match!</TranslatedText></CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Header
        actionButton={<AddPocketMatch userId={userId} />}
      >
        <TranslatedText id="pocket.games.header">Pocket Games</TranslatedText>
      </Header>
      <PocketMatchesList userId={userId} limit={5} initialGames={games} />
      <SeeMoreButton href="/pocket" />
    </div>
  );
}
