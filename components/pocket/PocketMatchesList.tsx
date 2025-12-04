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
import { format, formatDistanceToNowStrict } from 'date-fns';

//@TODO: Need to add edit capabilities for Pocket...

export const PocketMatchesList = ({
  userId,
  limit
}: {
  userId: string | undefined;
  limit?: number | undefined;
}) => {
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const { data: games } = usePocketGames(userId);

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
    [userId]
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

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 w-full'>
      {games?.map(game => (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Card
              result={game.result as 'W' | 'L'}
              className='px-4 py-2 flex justify-between items-center'
            >
              <Sprite name={game.deck} shouldFill />
              <div
                className={cn(
                  'text-md font-bold',
                  game.result === 'W' && 'text-emerald-600',
                  game.result === 'L' && 'text-red-600'
                )}
              >
                {game.result}
              </div>
              <Sprite name={game.opp_deck} shouldFill />
            </Card>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleDeletePocketGame(game.id)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
    </div>
  );
};
