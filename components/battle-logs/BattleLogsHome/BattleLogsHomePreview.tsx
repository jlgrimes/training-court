import { BattleLogsHomePreviewClient } from "./BattleLogsHomePreviewClient";
import Link from "next/link";

interface BattleLogsHomePreviewProps {
  userId: string | undefined;
}

export const BattleLogsHomePreview = async (props: BattleLogsHomePreviewProps) => {
  if (!props.userId) return null;

  return (
    <div className="flex flex-col gap-4">
      <Link href='/logs'>
        <h1 className="text-xl tracking-wide font-semibold">Logs</h1>
      </Link>
      <BattleLogsHomePreviewClient userId={props.userId} />
    </div>
  )
}