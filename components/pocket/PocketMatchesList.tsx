'use client';

import { usePocketGames } from "@/hooks/pocket/usePocketGames"
import { Card } from "../ui/card";
import { Sprite } from "../archetype/sprites/Sprite";
import { cn } from "@/lib/utils";

export const PocketMatchesList = ({ userId }: { userId: string | undefined }) => {
  const { data: games } = usePocketGames(userId);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 w-full">
      {games?.map((game) => (
        <Card result={game.result as 'W' | 'L'} className="px-4 py-2 flex justify-between items-center">
          <Sprite name={game.deck}/>
          <div className={cn(
            "text-md font-bold",
            game.result === 'W' && 'text-emerald-600',
            game.result === 'L' && 'text-red-600'
          )}>{game.result}</div>
          <Sprite name={game.opp_deck}/>
        </Card>
      ))}
    </div>
  )
}