import { Header } from "@/components/ui/header";
import { BattleLogsHomePreviewClient } from "./BattleLogsHomePreviewClient";
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

  return (
    <div className="flex flex-col gap-4">
      <Header>PTCG Logs</Header>
      <BattleLogsHomePreviewClient
        userId={userId}
        userData={userData}
        initialLogs={battleLogs}
      />
    </div>
  );
}
