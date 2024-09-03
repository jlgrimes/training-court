'use client';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDistanceToNowStrict } from "date-fns";
import { BattleLog } from "../utils/battle-log.types";
import { Sprite } from "../../archetype/Sprite";
import Link from "next/link";
import { useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { capitalizeName } from "../utils/battle-log.utils";

interface BattleLogPreviewProps {
  // unparsed battle log
  battleLog: BattleLog;
  currentUserScreenName: string | null | undefined;
}


//@TODO
export function BattleLogPreview (props: BattleLogPreviewProps) {
  const shouldReversePlayers = useMemo(() => {
    // because it doesn't matter
    if (!props.currentUserScreenName) return false;

    if (props.battleLog.players[1].name === props.currentUserScreenName) return true;

    return false;
  }, [props.battleLog.players, props.currentUserScreenName]);

  const players = useMemo(() => {
    if (shouldReversePlayers) return [props.battleLog.players[1], props.battleLog.players[0]];
    return props.battleLog.players;
  }, [shouldReversePlayers, props.battleLog.players]);

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
        <CardHeader className="grid grid-cols-8 items-center py-2">
          <Sprite name={players[0].deck} />
          {/* uh, idk where the mt- is coming from, can't find it so here */}
          <div className="col-span-6 pb-1 ml-4">
            <p className="text-slate-800 font-semibold tracking-normal text-lg leading-6">{`${gameResultAsText} vs ${getDeckAsText(players[1].deck)}`}</p>
            <CardDescription className="text-slate-800 opacity-50">{formatDistanceToNowStrict(props.battleLog.date)} ago</CardDescription>
          </div>
          <Sprite name={players[1].deck} />
        </CardHeader>
      </Card>
    </Link>
  )
}