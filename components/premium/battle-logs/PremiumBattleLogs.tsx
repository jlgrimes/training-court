import { Database } from "@/database.types"
import { GamesOverTime } from "./GamesOverTime"

interface PremiumBattleLogsProps {
  logs: Database['public']['Tables']['logs']['Row'][];
  currentUserScreenName: string | null;
}

export const PremiumBattleLogs = (props: PremiumBattleLogsProps) => {
  return (
    <div>
      <GamesOverTime logs={props.logs} currentUserScreenName={props.currentUserScreenName} />
    </div>
  )
}