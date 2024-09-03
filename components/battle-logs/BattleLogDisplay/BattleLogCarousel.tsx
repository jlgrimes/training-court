import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { BattleLogTurn } from "../utils/battle-log.types"
import { cn } from "@/lib/utils";

export function BattleLogCarousel({ sections }: { sections: BattleLogTurn[] }) {
    
    function getCardBackgroundColor(index: number, section: BattleLogTurn): string | undefined {
        if (index % 2 == 0 && !section.turnTitle.includes("Setup")) {
            return 'bg-blue-100';
          } else if (index % 2 == 1 && !section.turnTitle.includes("Setup")) {
            return 'bg-red-100';
          }
          return 'bg-gray-100';
    }

  return (
    <Carousel
      opts={{
        align: "start",
      }}
      orientation="vertical"
      className="w-full"
    >
      <CarouselContent className="-mt-1 max-h-[60vh]">
        {sections.map((section, index) => (
          <CarouselItem key={index} className="pt-1 basis-1/2">
            <div className="p-1">
              <Card className={` ${getCardBackgroundColor(index, section)}`}>
                <CardHeader>
                  <CardTitle>{section.turnTitle}</CardTitle>
                  {index > 2 && (
                    <CardDescription>
                      {Object.entries(section.prizesAfterTurn).map(([playerName, prizesRemaining]) => (
                        <span className={cn(
                          (section.player === playerName) && (section.prizesTaken > 0) && 'font-bold'
                        )}>{playerName}: {((section.player === playerName) && `${prizesRemaining + section.prizesTaken} → `)}{prizesRemaining} prize{prizesRemaining !== 1 && 's'}<br /></span>
                      ))}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="max-h-[50vh] overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-400">
                  <p>{section.body}</p>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}
