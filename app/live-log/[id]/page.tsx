import { Sprite } from "@/components/Sprite";
import { parseBattleLog } from "@/components/battle-logs/battle-log.utils";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function LiveLog({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: logData } = await supabase.from('logs').select('id,user,created_at,log').eq('id', params.id).maybeSingle();

  if (!logData ) {
    return redirect("/");
  }

  const battleLog = parseBattleLog(logData.log, logData.id, logData.user);

  return (
    <div className="flex-1 flex flex-col w-full h-full px-8 py-16 sm:max-w-lg justify-between gap-2">
      <div>
        <h1 className="scroll-m-20 text-3xl font-bold tracking-tight lg:text-4xl">game</h1>
        {<Sprite name={battleLog.players[0].deck} />}
        {<Sprite name={battleLog.players[1].deck} />}
        {JSON.stringify(logData.log)}
      </div>
    </div>
  );
}
