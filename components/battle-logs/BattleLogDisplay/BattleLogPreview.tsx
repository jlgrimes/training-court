'use client';

import {
  Card,
  CardDescription,
  CardTitle,
  SmallCardHeader,
} from "@/components/ui/card"
import { formatDistanceToNowStrict } from "date-fns";
import { BattleLog } from "../utils/battle-log.types";
import { Sprite } from "../../archetype/Sprite";
import Link from "next/link";
import { useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { capitalizeName, getTurnOrderOfPlayer } from "../utils/battle-log.utils";

interface BattleLogPreviewProps {
  // unparsed battle log
  battleLog: BattleLog;
  currentUserScreenName: string | null | undefined;
}


//@TODO
export function BattleLogPreview (props: BattleLogPreviewProps) {
  const gameResult = useMemo(() => {
    if (!props.currentUserScreenName) return undefined;

    if (props.battleLog.winner === props.currentUserScreenName) return 'W';
    return 'L';
  }, [props.currentUserScreenName, props.battleLog.winner]);

  const gameResultAsText = useMemo(() => {
    switch (gameResult) {
      case 'W':
        return 'Win';
      default:
        return 'Loss'
    }
  }, [gameResult])

  const getDeckAsText = useCallback((deck?: string) => {
    if (!deck) return '';
    return capitalizeName(deck.replace('-', ' '));
  }, []);

  return (
    <Link href={`/logs/${props.battleLog.id}`}>
      <Card result={gameResult} clickable>
        <SmallCardHeader className="grid grid-cols-8 items-center">
          <Sprite name={props.battleLog.players[0].deck} />
          {/* uh, idk where the mt- is coming from, can't find it so here */}
          <div className="col-span-4 ml-4">
            <CardTitle>{`${gameResultAsText} vs ${getDeckAsText(props.battleLog.players[1].deck)}`}</CardTitle>
            <CardDescription className="text-slate-800 opacity-50">{formatDistanceToNowStrict(props.battleLog.date)} ago</CardDescription>
          </div>
          <div className="text-right">
            <CardDescription className="font-semibold">{getTurnOrderOfPlayer(props.battleLog, props.battleLog.players[0].name)}</CardDescription>
          </div>
          <div />
          <Sprite name={props.battleLog.players[1].deck} />
        </SmallCardHeader>
      </Card>
    </Link>
  )
}