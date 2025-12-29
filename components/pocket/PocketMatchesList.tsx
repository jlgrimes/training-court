'use client';

import { usePocketGames } from '@/hooks/pocket/usePocketGames';
import { Card } from '../ui/card';
import { Sprite } from '../archetype/sprites/Sprite';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '../ui/use-toast';
import { useSWRConfig } from 'swr';
import { formatDistanceToNowStrict } from 'date-fns';
import type { PocketGame } from '@/lib/server/home-data';

interface PocketMatchesListProps {
  userId: string | undefined;
  limit?: number | undefined;
  /** Optional pre-fetched games - if provided, skips SWR fetch */
  initialGames?: PocketGame[];
}

export const PocketMatchesList = ({
  userId,
  limit,
  initialGames,
}: PocketMatchesListProps) => {
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  // Only fetch via SWR if no initial games provided
  const { data: swrGames } = usePocketGames(initialGames ? undefined : userId);

  const games = initialGames ?? swrGames;

  const handleDeletePocketGame = useCallback(
    async (gameId: number) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('pocket_games')
        .delete()
        .eq('id', gameId)
        .select();

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: error.message,
        });
      } else {
        mutate(['pocket-games', userId], data);
      }
    },
    [userId, toast, mutate]
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead className='pl-4'>My deck</TableHead>
          <TableHead className='w-[40px] text-center'>Result</TableHead>
          <TableHead className='pl-3 text-right'>Opponent</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {games?.slice(0, limit).map((game, idx) => (
          <TableRow key={`pocket-game-${idx}`} result={game.result} className={cn(
              'font-bold',
              game.result === 'W' && 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-300',
              game.result === 'T' && 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300',
              game.result === 'L' && 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-300',
            )}>
            <TableCell className='text-muted-foreground'>
              {formatDistanceToNowStrict(game.created_at, {
                addSuffix: true,
              })}
            </TableCell>
            <TableCell>
              <Sprite name={game.deck} shouldFill />
            </TableCell>
            <TableCell
              className={cn(
                'w-[40px] font-bold text-center',
                game.result === 'W' && 'text-emerald-600',
                game.result === 'L' && 'text-red-600'
              )}
            >
              {game.result}
            </TableCell>
            <TableCell className='flex justify-end'>
              <Sprite name={game.opp_deck} shouldFill />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
