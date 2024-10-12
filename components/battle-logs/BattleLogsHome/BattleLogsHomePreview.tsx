import { fetchCurrentUser } from "@/components/auth.utils";
import { fetchBattleLogs } from "../utils/battle-log.server.utils";
import { fetchUserData } from "@/components/user-data.utils";
import { BattleLogsHomePreviewClient } from "./BattleLogsHomePreviewClient";
import Link from "next/link";
import { Database } from "@/database.types";

interface BattleLogsHomePreviewProps {
  userData: Database['public']['Tables']['user data']['Row'] | null;
}

export const BattleLogsHomePreview = async (props: BattleLogsHomePreviewProps) => {
  if (!props.userData) return null;

  const logData = await fetchBattleLogs(props.userData.id);

  return logData && (
    <div className="flex flex-col gap-4">
      <Link href='/logs'>
        <h1 className="text-xl tracking-wide font-semibold text-slate-800">Logs</h1>
      </Link>
      <BattleLogsHomePreviewClient userData={props.userData} battleLogs={logData} />
    </div>
  )
}