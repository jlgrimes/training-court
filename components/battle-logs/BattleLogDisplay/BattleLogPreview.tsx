'use client';

import {
  Card,
  CardDescription,
  CardTitle,
  SmallCardHeader,
} from "@/components/ui/card"
import { format } from "date-fns";
import { BattleLog } from "../utils/battle-log.types";
import { Sprite } from "../../archetype/sprites/Sprite";
import Link from "next/link";
import { useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { capitalizeName, getTurnOrderOfPlayer } from "../utils/battle-log.utils";

export interface BattleLogPreviewProps {
  // unparsed battle log
  battleLog: BattleLog;
  currentUserScreenName: string | null | undefined;
}


//@TODO
export function BattleLogPreview (props: BattleLogPreviewProps) {
  const gameResult = useMemo(() => {
    if (!props.currentUserScreenName) return undefined;

    if (props.battleLog.winner.toLowerCase() === props.currentUserScreenName.toLowerCase()) return 'W';
    return 'L';
  }, [props.currentUserScreenName, props.battleLog.winner]);

  const userIsNotInTheBattleLog = useMemo(() => {
    return (props.currentUserScreenName?.toLowerCase() !== props.battleLog.players[0].name.toLowerCase()) && (props.currentUserScreenName?.toLowerCase() !== props.battleLog.players[1].name.toLowerCase());
  }, [props.battleLog.players[0].name, props.battleLog.players[1].name, props.currentUserScreenName])

  const gameResultAsText = useMemo(() => {
    switch (gameResult) {
      case 'W':
        return 'Win';
      default:
        return 'Loss'
    }
  }, [gameResult])

  const formatDeckName = useCallback((deck?: string) => {
    if (!deck) return 'unknown';
    return capitalizeName(deck);
  }, []);

  const cardSubtitle = useMemo(() => {
    return format(props.battleLog.date, 'LLL d, h:mm a');
  }, [props.battleLog.date]);

  if (userIsNotInTheBattleLog) {
    return (
      <Card className="flex-grow">
        <SmallCardHeader className="grid grid-cols-8 items-center">
          <Sprite name={props.battleLog.players[0].deck} shouldSmush={true}/>
          {/* uh, idk where the mt- is coming from, can't find it so here */}
          <div className="col-span-5 ml-4">
            <CardTitle>
              {`${formatDeckName(props.battleLog.players[0].deck)} vs ${props.battleLog.players[0].oppDeck ? formatDeckName(props.battleLog.players[0].oppDeck) : formatDeckName(props.battleLog.players[1].deck)}`}
            </CardTitle>
            <CardDescription className="text-slate-800 opacity-50">{cardSubtitle}</CardDescription>
          </div>
          <div />
          <Sprite name={props.battleLog.players[1].deck} shouldSmush={true}/>
        </SmallCardHeader>
        <SmallCardHeader>
          <CardDescription>{`It doesn't look like you are in this battle log. If this is a mistake, edit your screen name at the top of the page to match your PTCG live screen name.`}</CardDescription>
          <CardDescription>Your screen name: <b>{props.currentUserScreenName}</b></CardDescription>
          <CardDescription>Players in this battle: <b>{props.battleLog.players[0].name}, {props.battleLog.players[1].name}</b></CardDescription>
        </SmallCardHeader>
      </Card>
    )
  }

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
          <Sprite name={props.battleLog.players[0].deck} shouldSmush={true}/>
          {/* uh, idk where the mt- is coming from, can't find it so here */}
          <div className="col-span-4 ml-4">
            <CardTitle className="text-zinc-900 dark:text-zinc-100">{`${gameResultAsText} vs ${props.battleLog.players[0].oppDeck ? formatDeckName(props.battleLog.players[0].oppDeck) : formatDeckName(props.battleLog.players[1].deck)}`}</CardTitle>
            <CardDescription>{cardSubtitle}</CardDescription>
          </div>
          <div className="text-right">
            <CardDescription className="font-semibold">{getTurnOrderOfPlayer(props.battleLog, props.battleLog.players[0].name)}</CardDescription>
          </div>
          <div />
          <Sprite name={`${props.battleLog.players[0].oppDeck ? formatDeckName(props.battleLog.players[0].oppDeck) : formatDeckName(props.battleLog.players[1].deck)}`} shouldSmush={true} />
          </div>
        </SmallCardHeader>
      </Card>
    </Link>
  )
}