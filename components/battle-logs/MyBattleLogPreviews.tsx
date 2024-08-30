import { createClient } from "@/utils/supabase/server";
import { User } from "@supabase/supabase-js";
import { BattleLogPreview } from "./BattleLogPreview";
import { parseBattleLog } from "./battle-log.utils";
import { fetchUserData } from "../user-data.utils";

interface MyBattleLogPreviewsProps {
  user: User | null;
}

export async function MyBattleLogPreviews (props: MyBattleLogPreviewsProps) {
  if (!props.user) return; 

  const supabase = createClient();
  const { data: logData } = await supabase.from('logs').select('id,created_at,log').eq('user', props.user.id).order('created_at', { ascending: false });
  const userData = await fetchUserData(props.user.id);

  return (
    <div className="flex flex-col gap-2">
      {logData?.map((battleLog) => (
        <BattleLogPreview battleLog={parseBattleLog(battleLog.log, battleLog.id, battleLog.created_at)} currentUserScreenName={userData?.live_screen_name} />
      ))}
    </div>
  )
}