import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { BattleLog, BattleLogTurn } from "../utils/battle-log.types"
import { cn } from "@/lib/utils";
import { BattleLogDetectedStrings } from "@/lib/i18n/battle-log"

interface BattleLogCarouselProps {
  battleLog: BattleLog;
}

export function BattleLogCarousel(props: BattleLogCarouselProps) {
    
    function getCardBackgroundColor(index: number, section: BattleLogTurn): string | undefined {
        if (index % 2 == 0 && !section.turnTitle.includes(BattleLogDetectedStrings[props.battleLog.language].setup)) {
            return 'bg-blue-100';
          } else if (index % 2 == 1 && !section.turnTitle.includes(BattleLogDetectedStrings[props.battleLog.language].setup)) {
            return 'bg-red-100';
          }
          return 'bg-gray-100';
    }

  return (
    <div className="flex flex-col gap-4">
        {props.battleLog.sections.map((section, index) => (
          <Card className={` ${getCardBackgroundColor(index, section)}`}>
            <CardHeader>
              <CardTitle>{section.turnTitle}</CardTitle>
              {index > 0 && (
                <CardDescription>
                  {Object.entries(section.prizesAfterTurn).map(([playerName, prizesRemaining]) => {
                    const previousPrizesOfThisPlayer = props.battleLog.sections[index - 1].prizesAfterTurn[playerName];
                    const prizesThisPlayerHasTaken = (index === 0) ? 0 : previousPrizesOfThisPlayer - section.prizesAfterTurn[playerName];

                    return (
                      <span className={cn(
                        (prizesThisPlayerHasTaken > 0) && 'font-bold'
                      )}>{playerName}: {((section.player === playerName || prizesThisPlayerHasTaken > 0) && `${previousPrizesOfThisPlayer} → `)}{prizesRemaining} prize{prizesRemaining !== 1 && 's'}<br /></span>
                    )
                  })}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {section.actions.map((action) => action.details.length === 0 ? (
                <p className="py-1">{action.title}</p>
              ) : (
                <Accordion type="single" collapsible>
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="px-0 py-1 text-left">{action.title}</AccordionTrigger>
                    <AccordionContent>
                      {action.details.map((detail) => <p>{detail}<br /></p>)}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        ))}
    </div>
  )
}
