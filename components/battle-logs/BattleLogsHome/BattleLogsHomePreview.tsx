import { Header } from "@/components/ui/header";
import { BattleLogsHomePreviewClient } from "./BattleLogsHomePreviewClient";
import type { UserData, BattleLog } from "@/lib/server/home-data";

interface BattleLogsHomePreviewProps {
  userId: string;
  userData: UserData | null;
  battleLogs: BattleLog[];
}

export function BattleLogsHomePreview(props: BattleLogsHomePreviewProps) {
  if (!props.userId) return null;

  return (
    <div className="flex flex-col gap-4">
      <Header>PTCG Logs</Header>
      <BattleLogsHomePreviewClient
        userId={props.userId}
        userData={props.userData}
        initialLogs={props.battleLogs}
      />
    </div>
  );
}
