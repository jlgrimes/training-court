import { Sprite } from "@/components/Sprite";
import { parseBattleLog } from "@/components/battle-logs/battle-log.utils";
import { createClient } from "@/utils/supabase/server";
import { formatDistanceToNowStrict } from "date-fns";
import { redirect } from "next/navigation";

export default async function LiveLog({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: logData } = await supabase.from('logs').select('id,user,created_at,log').eq('id', params.id).maybeSingle();

  if (!logData ) {
    return redirect("/");
  }

  const battleLog = parseBattleLog(logData.log, logData.id, logData.created_at);

  return (
    <div className="flex-1 flex flex-col w-full h-full p-8 sm:max-w-lg justify-between gap-2">
      <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-evenly w-full">
          <div className="flex items-center gap-2">
            {<Sprite name={battleLog.players[0].deck} />}
            <h2 className="text-xl font-semibold">{battleLog.players[0].name}</h2>
          </div>
          <div className="flex items-center gap-2">
            {<Sprite name={battleLog.players[1].deck} />}
            <h2 className="text-xl font-semibold">{battleLog.players[1].name}</h2>
          </div>
        </div>
        <h3 className="text-sm text-muted-foreground">{formatDistanceToNowStrict(battleLog.date)} ago</h3>
      </div>
        <div>
          {battleLog.actions.map((action) => <div>{action.message}</div>)}
        </div>
      </div>
    </div>
  );
}
