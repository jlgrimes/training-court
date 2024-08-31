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
  return (
    <Carousel
      opts={{
        align: "start",
      }}
      orientation="vertical"
      className="w-full"
    >
      <CarouselContent className="-mt-1 h-[600px]">
        {sections.map((section, index) => (
          <CarouselItem key={index} className="pt-1 basis-1/2">
            <div className="p-1">
              <Card>
                <CardContent className="p-6 max-h-[600px] overflow-y-auto">
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
