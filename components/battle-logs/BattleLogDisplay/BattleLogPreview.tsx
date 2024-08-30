'use client';

import {
  Card,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"
import { formatDistanceToNowStrict } from "date-fns";
import { BattleLog } from "../utils/battle-log.types";
import { Sprite } from "../../archetype/Sprite";
import Link from "next/link";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface BattleLogPreviewProps {
  // unparsed battle log
  battleLog: BattleLog;
  currentUserScreenName: string | null;
}

export function BattleLogPreview (props: BattleLogPreviewProps) {
  const shouldReversePlayers = useMemo(() => {
    // because it doesn't matter
    if (!props.currentUserScreenName) return false;

    if (props.battleLog.players[1].name === props.currentUserScreenName) return true;

    return false;
  }, [props.battleLog.players, props.currentUserScreenName]);

  const players = useMemo(() => {
    if (shouldReversePlayers) return props.battleLog.players.reverse();
    return props.battleLog.players;
  }, [shouldReversePlayers, props.battleLog.players]);

  const gameResult = useMemo(() => {
    if (!props.currentUserScreenName) return undefined;

    if (props.battleLog.winner === props.currentUserScreenName) return 'W';
    return 'L';
  }, [props.currentUserScreenName, props.battleLog.winner]);

  return (
    <Link href={`/live-log/${props.battleLog.id}`}>
      <Card result={gameResult}>
        <CardHeader>
          <div className="flex items-center">
            <Sprite name={players[0].deck} />
            <div className="font-semibold ml-2 mr-3">vs</div>
            <Sprite name={players[1].deck} />
          </div>
          {/* <CardTitle>game</CardTitle> */}
          <CardDescription>{formatDistanceToNowStrict(props.battleLog.date)} ago</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}