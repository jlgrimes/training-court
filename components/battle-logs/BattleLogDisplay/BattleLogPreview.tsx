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
import { useRecoilValue } from "recoil";
import { userState } from "@/app/state/atoms";

export interface BattleLogPreviewProps {
  // unparsed battle log
  battleLog: BattleLog;
  userData?: { live_screen_name: string };
}


//@TODO 
export function BattleLogPreview (props: BattleLogPreviewProps) {
  const userData = props.userData ?? useRecoilValue(userState);
  const currentUserScreenName = userData?.live_screen_name;

  const gameResult = useMemo(() => {
    if (!currentUserScreenName) return undefined;

    if (props.battleLog.winner.toLowerCase() === currentUserScreenName.toLowerCase()) return 'W';
    return 'L';
  }, [currentUserScreenName, props.battleLog.winner]);

  const userIsNotInTheBattleLog = useMemo(() => {
    return (currentUserScreenName?.toLowerCase() !== props.battleLog.players[0].name.toLowerCase()) && (currentUserScreenName?.toLowerCase() !== props.battleLog.players[1].name.toLowerCase());
  }, [props.battleLog.players[0].name, props.battleLog.players[1].name, currentUserScreenName])

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
          <CardDescription>Your screen name: <b>{currentUserScreenName}</b></CardDescription>
          <CardDescription>Players in this battle: <b>{props.battleLog.players[0].name}, {props.battleLog.players[1].name}</b></CardDescription>
        </SmallCardHeader>
      </Card>
    )
  }

  return (
    <Link className="flex-grow" href={`/logs/${props.battleLog.id}`}>
      <Card result={gameResult} clickable>
        <SmallCardHeader>
          <div className="grid grid-cols-8 items-center">
          <Sprite name={props.battleLog.players[0].deck} shouldSmush={true}/>
          {/* uh, idk where the mt- is coming from, can't find it so here */}
          <div className="col-span-4 ml-4">
            <CardTitle>{`${gameResultAsText} vs ${props.battleLog.players[0].oppDeck ? formatDeckName(props.battleLog.players[0].oppDeck) : formatDeckName(props.battleLog.players[1].deck)}`}</CardTitle>
            <CardDescription className="text-slate-800 opacity-50">{cardSubtitle}</CardDescription>
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