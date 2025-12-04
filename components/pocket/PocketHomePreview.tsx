'use client'

import { AddPocketMatch } from '@/components/pocket/AddPocketMatch';
import { usePocketGames } from '@/hooks/pocket/usePocketGames';
import { Header } from '@/components/ui/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardDescription, CardHeader } from '@/components/ui/card';
import { SeeMoreButton } from '../SeeMoreButton';
import { PocketMatchesList } from './PocketMatchesList';

export function PocketHomePreview({ userId }: { userId: string }) {
  const { data: games, isLoading } = usePocketGames(userId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Header
          actionButton={<AddPocketMatch userId={userId} />}
        >
          Pocket Games
        </Header>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!games || games.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <Header
          description="Log your Pocket matches from home"
          actionButton={<AddPocketMatch userId={userId} />}
        >
          Pocket Games
        </Header>
        <Card className="border-none">
          <CardHeader className="px-2">
            <CardDescription>No Pocket games yet. Add your first match!</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const recent = games.slice(0, 5);

  return (
    <div className="flex flex-col gap-4">
      <Header
        actionButton={<AddPocketMatch userId={userId} />}
      >
        Pocket Games
      </Header>
      <PocketMatchesList userId={userId} limit={5} />
      <SeeMoreButton href="/pocket" />
    </div>
  );
}
