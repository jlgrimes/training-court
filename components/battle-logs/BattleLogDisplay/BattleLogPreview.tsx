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

interface BattleLogPreviewProps {
  // unparsed battle log
  battleLog: BattleLog;
  currentUserScreenName: string | null;
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
        return 'win';
      default:
        return 'loss'
    }
  }, [gameResult])

  const getDeckAsText = useCallback((deck?: string) => {
    return deck?.replace('-', ' ');
  }, []);

  return (
    <Link href={`/live-log/${props.battleLog.id}`}>
      <Card result={gameResult}>
        <CardHeader className="grid grid-cols-8 items-center">
          <Sprite faded name={players[0].deck} />
          {/* <CardTitle>game</CardTitle> */}
          <div className="col-span-6 ml-4">
            <CardTitle>{`${gameResultAsText} vs ${getDeckAsText(players[1].deck)}`}</CardTitle>
            <CardDescription>{formatDistanceToNowStrict(props.battleLog.date)} ago</CardDescription>
          </div>
          <Sprite name={players[1].deck} />
        </CardHeader>
      </Card>
    </Link>
  )
}