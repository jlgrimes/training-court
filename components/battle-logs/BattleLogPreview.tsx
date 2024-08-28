import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDistanceToNowStrict } from "date-fns";
import { BattleLog } from "./battle-log.types";
import { Sprite } from "../Sprite";

interface BattleLogPreviewProps {
  // unparsed battle log
  battleLog: BattleLog;
}

export function BattleLogPreview (props: BattleLogPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <div style={{ display: 'flex' }}>
          <Sprite name={props.battleLog.players[0].deck} />
          <Sprite name={props.battleLog.players[1].deck} />
        </div>
        <CardTitle>game</CardTitle>
        <CardDescription>{formatDistanceToNowStrict(props.battleLog.date)} ago</CardDescription>
      </CardHeader>
    </Card>
  )
}