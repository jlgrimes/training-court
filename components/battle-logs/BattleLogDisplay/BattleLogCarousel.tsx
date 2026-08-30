'use client';

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { BattleLog, BattleLogTurn } from "../utils/battle-log.types"
import { cn } from "@/lib/utils";
import { BattleLogDetectedStrings } from "@/lib/i18n/battle-log"
import { ClipboardList } from "lucide-react";
import { useUiRefresh } from "@/hooks/useUiRefresh";
import { actionsWithoutDuplicateSetupLabel, isSetupSection } from "./battle-log-carousel.utils";

interface BattleLogCarouselProps {
  battleLog: BattleLog;
}

export function BattleLogCarousel(props: BattleLogCarouselProps) {
    const { enabled: uiRefresh } = useUiRefresh();
    const setupLabel = BattleLogDetectedStrings[props.battleLog.language].setup;
    
    function getCardBackgroundColor(index: number, section: BattleLogTurn): string | undefined {
        if (index % 2 == 0 && !section.turnTitle.includes(setupLabel)) {
            return 'bg-blue-100 dark:bg-blue-900';
          } else if (index % 2 == 1 && !section.turnTitle.includes(setupLabel)) {
            return 'bg-red-100 dark:bg-red-900';
          }
          return 'bg-gray-100 dark:bg-gray-900';
    }

  return (
    <div className="flex flex-col gap-4">
        {props.battleLog.sections.map((section, index) => {
          const isSetup = isSetupSection(section, setupLabel);
          const actions = uiRefresh
            ? actionsWithoutDuplicateSetupLabel(section, setupLabel)
            : section.actions;

          return (
          <Card key={`${section.turnTitle}-${index}`} className={` ${getCardBackgroundColor(index, section)}`}>
            <CardHeader>
              <CardTitle className="dark:text-white flex items-center gap-2">
                {uiRefresh && isSetup && <ClipboardList className="h-4 w-4" />}
                {section.turnTitle}
              </CardTitle>
              {index > 0 && (
                <CardDescription>
                  {Object.entries(section.prizesAfterTurn).map(([playerName, prizesRemaining]) => {
                    const previousPrizesOfThisPlayer = props.battleLog.sections[index - 1].prizesAfterTurn[playerName];
                    const prizesThisPlayerHasTaken = (index === 0) ? 0 : previousPrizesOfThisPlayer - section.prizesAfterTurn[playerName];

                    return (
                      <span key={playerName} className={cn(
                        (prizesThisPlayerHasTaken > 0) && 'font-bold'
                      )}>{playerName}: {((section.player === playerName || prizesThisPlayerHasTaken > 0) && `${previousPrizesOfThisPlayer} → `)}{prizesRemaining} prize{prizesRemaining !== 1 && 's'}<br /></span>
                    )
                  })}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {actions.map((action, actionIdx) => action.details.length === 0 ? (
                <p key={`${action.title}-${actionIdx}`} className="py-1">{action.title}</p>
              ) : (
                <Accordion key={`${action.title}-${actionIdx}`} type="single" collapsible>
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="px-0 py-1 text-left">{action.title}</AccordionTrigger>
                    <AccordionContent>
                      {action.details.map((detail, detailIdx) => <p key={`${detail}-${detailIdx}`}>{detail}<br /></p>)}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))}
            </CardContent>
          </Card>
          );
        })}
    </div>
  )
}
