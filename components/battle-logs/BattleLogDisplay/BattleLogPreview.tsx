'use client';

import {
  Card,
  CardDescription,
  CardTitle,
  SmallCardHeader,
} from "@/components/ui/card"
import { format } from "date-fns";
import { Sprite } from "../../archetype/sprites/Sprite";
import Link from "next/link";
import { useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { capitalizeName } from "../utils/battle-log.utils";
import {
  BattleLogPreviewRecord,
  getBattleLogPreviewDeck,
  getBattleLogPreviewOppDeck,
  getBattleLogPreviewResult,
  getBattleLogPreviewResultText,
  getBattleLogPreviewTurnOrder,
} from "../utils/battle-log-preview.utils";

export interface BattleLogPreviewProps {
  battleLog: BattleLogPreviewRecord;
  currentUserScreenName: string | null | undefined;
}


//@TODO
export function BattleLogPreview (props: BattleLogPreviewProps) {
  const gameResult = useMemo(() => getBattleLogPreviewResult(props.battleLog), [props.battleLog]);
  const gameResultAsText = useMemo(() => getBattleLogPreviewResultText(props.battleLog), [props.battleLog])
  const myDeck = useMemo(() => getBattleLogPreviewDeck(props.battleLog), [props.battleLog]);
  const oppDeck = useMemo(() => getBattleLogPreviewOppDeck(props.battleLog), [props.battleLog]);
  const turnOrder = useMemo(() => getBattleLogPreviewTurnOrder(props.battleLog), [props.battleLog]);

  const formatDeckName = useCallback((deck?: string) => {
    if (!deck) return 'unknown';
    return capitalizeName(deck);
  }, []);

  const cardSubtitle = useMemo(() => {
    return format(props.battleLog.created_at, 'LLL d, h:mm a');
  }, [props.battleLog.created_at]);

  return (
    <Link className="flex-grow" href={`/ptcg/logs/${props.battleLog.id}`}>
      <Card result={gameResult} className={cn(
          "clickable",
          gameResult === "W" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:hover:bg-emerald-700",
          gameResult === "L" && "bg-red-100 text-red-700 dark:bg-red-900 dark:hover:bg-red-700",
          gameResult === undefined && "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-300",
        )}>
        <SmallCardHeader>
          <div className="grid grid-cols-8 items-center">
          <Sprite name={myDeck} shouldSmush={true}/>
          {/* uh, idk where the mt- is coming from, can't find it so here */}
          <div className="col-span-4 ml-4">
            <CardTitle className="text-zinc-900 dark:text-zinc-100">{`${gameResultAsText} vs ${formatDeckName(oppDeck)}`}</CardTitle>
            <CardDescription>{cardSubtitle}</CardDescription>
          </div>
          <div className="text-right">
            <CardDescription className="font-semibold">{turnOrder}</CardDescription>
          </div>
          <div />
          <Sprite name={oppDeck} shouldSmush={true} />
          </div>
        </SmallCardHeader>
      </Card>
    </Link>
  )
}
