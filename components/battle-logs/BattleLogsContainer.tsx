import { fetchBattleLogs } from "./utils/battle-log.server.utils";
import { fetchCurrentUser } from "../auth.utils";
import { BattleLogsContainerClient } from "./BattleLogsContainerClient";
import { fetchUserData } from "../user-data.utils";
import { parseBattleLog } from "./utils/battle-log.utils";
import { Database } from "@/database.types";


export async function BattleLogsContainer () {
  const user = await fetchCurrentUser();

  // TODO: Update these to return something useful
  if (!user) return null;

  const logDataFromDb = await fetchBattleLogs(user.id);
  let userData = await fetchUserData(user.id);

  if (!userData || !logDataFromDb) return null;

  const logData = logDataFromDb.map((battleLog: Database['public']['Tables']['logs']['Row']) => 
    parseBattleLog(battleLog.log, battleLog.id, battleLog.created_at, battleLog.archetype, battleLog.opp_archetype, userData.live_screen_name));

  return (
    <BattleLogsContainerClient userData={userData} logs={logData} />
  )
}