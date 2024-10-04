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
    <BattleLogsHomePreviewClient userData={userData} battleLogs={logData} />
  )
}