import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDistanceToNowStrict } from "date-fns";
import { BattleLog } from "./battle-log.types";

interface BattleLogPreviewProps<P1, P2> {
  // unparsed battle log
  battleLog: BattleLog<P1, P2>;
}

export function BattleLogPreview<P1, P2> (props: BattleLogPreviewProps<P1, P2>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>game</CardTitle>
        <CardDescription>{formatDistanceToNowStrict(props.battleLog.date)} ago</CardDescription>
      </CardHeader>
    </Card>
  )
}