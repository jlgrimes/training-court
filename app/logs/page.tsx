import { fetchCurrentUser } from "@/components/auth.utils"
import { BattleLogPreview } from "@/components/battle-logs/BattleLogDisplay/BattleLogPreview";
import { fetchBattleLogs } from "@/components/battle-logs/utils/battle-log.server.utils"
import { parseBattleLog } from "@/components/battle-logs/utils/battle-log.utils";
import { fetchUserData } from "@/components/user-data.utils";
import { redirect } from "next/navigation";

export default async function LogsPage() {
  const currentUser = await fetchCurrentUser();

  if (!currentUser) {
    redirect('/');
  }

  const logs = await fetchBattleLogs(currentUser.id);
  const userData = await fetchUserData(currentUser.id);
  
  return (
    <div className="flex flex-col gap-2">
      {logs?.map((battleLog) => (
        <BattleLogPreview battleLog={parseBattleLog(battleLog.log, battleLog.id, battleLog.created_at, battleLog.archetype, userData?.live_screen_name ?? null)} currentUserScreenName={userData?.live_screen_name} />
      ))}
    </div>
  )
}
