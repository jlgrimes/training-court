import { fetchCurrentUser } from "@/components/auth.utils";
import { fetchBattleLogs } from "../utils/battle-log.server.utils";
import { fetchUserData } from "@/components/user-data.utils";
import { BattleLogsHomePreviewClient } from "./BattleLogsHomePreviewClient";

export const BattleLogsHomePreview = async () => {
  const user = await fetchCurrentUser();

  // TODO: Update these to return something useful
  if (!user) return null;

  const logData = await fetchBattleLogs(user.id);
  let userData = await fetchUserData(user.id);

  return userData && logData && (
    <div>
      <h1 className="text-2xl tracking-wide font-semibold text-slate-800">Logs</h1>
      <BattleLogsHomePreviewClient userData={userData} battleLogs={logData} />
    </div>
  )
}