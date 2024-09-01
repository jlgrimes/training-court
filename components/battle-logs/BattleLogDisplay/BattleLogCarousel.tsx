import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { BattleLogSections } from "../utils/battle-log.types"

export function BattleLogCarousel({ sections }: { sections: BattleLogSections[] }) {
    
    function getCardBackgroundColor(index: number, section: BattleLogSections): string | undefined {
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
                <CardContent className="p-6 max-h-[50vh] overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-400">
                  <h4 className="text-xl font-semibold">{section.turnTitle}</h4>
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
