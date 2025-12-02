import { Header } from "@/components/ui/header";
import { BattleLogsHomePreviewClient } from "./BattleLogsHomePreviewClient";

interface BattleLogsHomePreviewProps {
  userId: string | undefined;
}

export const BattleLogsHomePreview = async (props: BattleLogsHomePreviewProps) => {
  if (!props.userId) return null;

  return (
    <div className="flex flex-col gap-4">
      <Header>PTCG Logs</Header>
      <BattleLogsHomePreviewClient userId={props.userId} />
    </div>
  )
}