'use client';

import { usePocketGames } from "@/hooks/pocket/usePocketGames"
import { Card, CardContent, SmallCardHeader } from "../ui/card";
import { Sprite } from "../archetype/sprites/Sprite";

export const PocketMatchesList = ({ userId }: { userId: string | undefined }) => {
  const { data: games } = usePocketGames(userId);

  return (
    <div className="grid grid-cols-4 gap-2 w-full">
      {games?.map((game) => (
        <Card result={game.result as 'W' | 'L'} className="p-4 flex justify-between">
          <Sprite name={game.deck}/>
          <Sprite name={game.opp_deck}/>
        </Card>
      ))}
    </div>
  )
}