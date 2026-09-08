import { cache } from "react";
import { LogPageClient } from "@/components/battle-logs/BattleLogDisplay/LogPageClient";
import { parseBattleLog } from "@/components/battle-logs/utils/battle-log.utils";
import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/server";
import { Metadata } from "next";

// Shared by metadata and the page body so one request performs one database read.
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

  const battleLog = parseBattleLog(logData.log, logData.id, logData.created_at, logData.archetype, logData.opp_archetype, null, logData.format);

  return {
    title: `${battleLog.players[0].name} vs ${battleLog.players[1].name}`
  };
}

export default async function LiveLog({ params }: { params: { id: string } }) {
  const log = await fetchLog(params.id);
  return <LogPageClient logId={params.id} initialLog={log} />;
}
