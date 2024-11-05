'use client';

import { usePocketGames } from "@/hooks/pocket/usePocketGames"
import { Card } from "../ui/card";
import { Sprite } from "../archetype/sprites/Sprite";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "../ui/use-toast";
import { useSWRConfig } from "swr";

export const PocketMatchesList = ({ userId }: { userId: string | undefined }) => {
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const { data: games } = usePocketGames(userId);

  const handleDeletePocketGame = useCallback(async (gameId: number) => {
    const supabase = createClient();
    const { data, error } = await supabase.from('pocket_games').delete().eq('id', gameId).select();

    if (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message,
      });
    } else {
      mutate(['pocket-games', userId], data);
    }
  }, [userId]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 w-full">
      {games?.map((game) => (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Card result={game.result as 'W' | 'L'} className="px-4 py-2 flex justify-between items-center">
              <Sprite name={game.deck} shouldFill/>
              <div className={cn(
                "text-md font-bold",
                game.result === 'W' && 'text-emerald-600',
                game.result === 'L' && 'text-red-600'
              )}>{game.result}</div>
              <Sprite name={game.opp_deck} shouldFill/>
            </Card>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleDeletePocketGame(game.id)}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
    </div>
  )
}