import { Header } from "@/components/ui/header";
import { AddBattleLogInput } from "../BattleLogInput/AddBattleLogInput";
import { BattleLogsByDayPreview } from "./BattleLogsByDayPreview";
import { parseBattleLog } from "../utils/battle-log.utils";
import { fetchUserDataServer, fetchBattleLogsServer } from "@/lib/server/home-data";

interface BattleLogsHomePreviewProps {
  userId: string;
}

/**
 * Self-contained server component widget for battle logs.
 * Fetches its own data - can be placed on any page.
 */
export async function BattleLogsHomePreview({ userId }: BattleLogsHomePreviewProps) {
  if (!userId) return null;

  // Fetch data server-side in parallel
  const [userData, battleLogs] = await Promise.all([
    fetchUserDataServer(userId),
    fetchBattleLogsServer(userId, 0, 4),
  ]);

  const parsedLogs = battleLogs.map(log => (
    parseBattleLog(log.log, log.id, log.created_at, log.archetype, log.opp_archetype, userData?.live_screen_name ?? null, log.format)
  ));

  return (
    <div className="flex flex-col gap-4">
      <Header>PTCG Logs</Header>
      <div className="flex flex-col gap-4">
        {userData?.live_screen_name && parsedLogs.length > 0 && (
          <BattleLogsByDayPreview
            userData={userData}
            battleLogs={parsedLogs}
          />
        )}
        <AddBattleLogInput userData={userData ?? null} />
      </div>
    </div>
  );
}
