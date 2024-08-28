import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDistanceToNowStrict } from "date-fns";
import { BattleLog } from "./battle-log.types";

interface BattleLogPreviewProps {
  // unparsed battle log
  battleLog: BattleLog;
}

export function BattleLogPreview (props: BattleLogPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>game</CardTitle>
        <CardDescription>{formatDistanceToNowStrict(props.battleLog.date)} ago</CardDescription>
      </CardHeader>
    </Card>
  )
}