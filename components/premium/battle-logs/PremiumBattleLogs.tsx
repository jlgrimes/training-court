import { Database } from "@/database.types"
import { LogWinRates } from "./LogWinRates"

interface PremiumBattleLogsProps {
  logs: Database['public']['Tables']['logs']['Row'][];
  currentUserScreenName: string | null;
}

export const PremiumBattleLogs = (props: PremiumBattleLogsProps) => {
  return (
    <div>
      <LogWinRates logs={props.logs} currentUserScreenName={props.currentUserScreenName} />
    </div>
  )
}