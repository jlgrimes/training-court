import { fetchBattleLogs } from "./utils/battle-log.server.utils";
import { fetchCurrentUser } from "../auth.utils";
import { BattleLogsContainerClient } from "./BattleLogsContainerClient";
import { fetchUserData } from "../user-data.utils";


export async function BattleLogsContainer () {
  const user = await fetchCurrentUser();

  // TODO: Update these to return something useful
  if (!user) return null;

  const logData = await fetchBattleLogs(user.id);
  let userData = await fetchUserData(user.id);

  if (!logData) return null;

  return (
    <BattleLogsContainerClient userData={userData} logs={logData} />
  )
}