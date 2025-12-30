import { cache } from "react";
import { Sprite } from "@/components/archetype/sprites/Sprite";
import { fetchCurrentUser } from "@/components/auth.utils";
import { BattleLogCarousel } from "@/components/battle-logs/BattleLogDisplay/BattleLogCarousel";
import { Notes } from "@/components/battle-logs/Notes/Notes";
import { parseBattleLog } from "@/components/battle-logs/utils/battle-log.utils";
import { fetchUserData } from "@/components/user-data.utils";
import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/server";
import { formatDistanceToNowStrict } from "date-fns";
import { Metadata } from "next";
import { redirect } from "next/navigation";

// Cache the log fetch so generateMetadata and page share the same query
const fetchLog = cache(async (logId: string) => {
  const supabase = createClient();
  const { data } = await supabase.from('logs').select().eq('id', logId).returns<Database['public']['Tables']['logs']['Row'][]>().maybeSingle();
  return data;
});

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const logData = await fetchLog(params.id);

  if (!logData) return {
    title: 'Battle'
  };

  const battleLog = parseBattleLog(logData.log, logData.id, logData.created_at, logData.archetype, logData.opp_archetype, null);

  return {
    title: `${battleLog.players[0].name} vs ${battleLog.players[1].name}`
  };
}

export default async function LiveLog({ params }: { params: { id: string } }) {
  // Fetch all data in parallel
  const [currentUser, logData] = await Promise.all([
    fetchCurrentUser(),
    fetchLog(params.id),
  ]);

  if (!logData) {
    return redirect("/");
  }

  // Fetch userData only if we have a user
  const userData = currentUser ? await fetchUserData(currentUser.id) : null;

  const battleLog = parseBattleLog(logData.log, logData.id, logData.created_at, logData.archetype, logData.opp_archetype, userData?.live_screen_name ?? null);

  return (
    <div className="flex-1 flex flex-col w-full h-full sm:max-w-lg justify-between gap-2 p-4">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-evenly w-full">
            <div className="flex items-center gap-2">
              <Sprite name={logData.archetype} />
              {/* battleLog.players[0].deck */}
              <h2 className="text-xl font-semibold">{battleLog.players[0].name}</h2>
            </div>
            <div className="flex items-center gap-2">
              <Sprite name={logData.opp_archetype ? logData.opp_archetype : battleLog.players[1].deck} />
              <h2 className="text-xl font-semibold">{battleLog.players[1].name}</h2>
            </div>
          </div>
          <h3 className="text-sm text-muted-foreground">
            {formatDistanceToNowStrict(battleLog.date)} ago
          </h3>
        </div>
        {currentUser && userData?.live_screen_name && (userData.live_screen_name === battleLog.players[0].name) && (
          <Notes logId={logData.id} serverLoadedNotes={logData.notes} />
        )}
        <div className="mt-6">
          <BattleLogCarousel battleLog={battleLog} />
        </div>
      </div>
    </div>
  );
}
