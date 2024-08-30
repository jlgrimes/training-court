import { fetchBattleLogs } from "./battle-log.utils";
import { fetchCurrentUser } from "../auth.utils";
import { RadioTower } from "lucide-react";
import { AddBattleLogInput } from "./AddBattleLogInput";
import { MyBattleLogPreviews } from "./MyBattleLogPreviews";
import { BattleLogsContainerClient } from "./BattleLogsContainerClient";
import { fetchUserData } from "../user-data.utils";


export async function BattleLogsContainer () {
  const user = await fetchCurrentUser();

  // TODO: Update these to return something useful
  if (!user) return null;

  const logData = await fetchBattleLogs(user.id);
  let userData = await fetchUserData(user.id);

  if (!userData) {
    userData = {
      id: user.id,
      created_at: '',
      avatar: null,
      live_screen_name: null
    }
  }

  if (!logData) return null;

  return (
    <BattleLogsContainerClient userData={userData} logs={logData} />
  )
}