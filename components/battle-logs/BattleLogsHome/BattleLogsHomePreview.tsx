import { fetchCurrentUser } from "@/components/auth.utils";
import { fetchBattleLogs } from "../utils/battle-log.server.utils";
import { fetchUserData } from "@/components/user-data.utils";
import { BattleLogsHomePreviewClient } from "./BattleLogsHomePreviewClient";
import Link from "next/link";

export const BattleLogsHomePreview = async () => {
  const user = await fetchCurrentUser();

  // TODO: Update these to return something useful
  if (!user) return null;

  const logData = await fetchBattleLogs(user.id);
  let userData = await fetchUserData(user.id);

  return userData && logData && (
    <div className="flex flex-col gap-4">
      <Link href='/logs'>
        <h1 className="text-xl tracking-wide font-semibold text-slate-800">Logs</h1>
      </Link>
      <BattleLogsHomePreviewClient userData={userData} battleLogs={logData} />
    </div>
  )
}