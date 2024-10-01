import { Sprite } from "@/components/archetype/sprites/Sprite";
import { fetchCurrentUser } from "@/components/auth.utils";
import { BattleLogCarousel } from "@/components/battle-logs/BattleLogDisplay/BattleLogCarousel";
import { Notes } from "@/components/battle-logs/Notes/Notes";
import { parseBattleLog } from "@/components/battle-logs/utils/battle-log.utils";
import { fetchUserData } from "@/components/user-data.utils";
import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/server";
import { formatDistanceToNowStrict } from "date-fns";
import { redirect } from "next/navigation";

export default async function LiveLog({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const currentUser = await fetchCurrentUser();
  const userData = await fetchUserData(currentUser?.id ?? '');
  const { data: logData } = await supabase.from('logs').select().eq('id', params.id).returns<Database['public']['Tables']['logs']['Row'][]>().maybeSingle();

  if (!logData ) {
    return redirect("/");
  }

  const battleLog = parseBattleLog(logData.log, logData.id, logData.created_at, logData.archetype, userData?.live_screen_name ?? null);

  return (
    <div className="flex-1 flex flex-col w-full h-full sm:max-w-lg justify-between gap-2 p-4">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-evenly w-full">
            <div className="flex items-center gap-2">
              <Sprite name={battleLog.players[0].deck} />
              <h2 className="text-xl font-semibold">{battleLog.players[0].name}</h2>
            </div>
            <div className="flex items-center gap-2">
              <Sprite name={battleLog.players[1].deck} />
              <h2 className="text-xl font-semibold">{battleLog.players[1].name}</h2>
            </div>
          </div>
          <h3 className="text-sm text-muted-foreground">
            {formatDistanceToNowStrict(battleLog.date)} ago
          </h3>
        </div>
        {userData?.live_screen_name && (userData.live_screen_name === battleLog.players[0].name) && (
          <Notes logId={logData.id} serverLoadedNotes={logData.notes} />
        )}
        <div className="mt-6">
          <BattleLogCarousel sections={battleLog.sections} />
        </div>
      </div>
    </div>
  );
}
