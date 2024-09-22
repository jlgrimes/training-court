import { Database } from "@/database.types"
import { LogWinRates } from "./LogWinRates"

interface PremiumBattleLogsProps {
  logs: Database['public']['Tables']['logs']['Row'][];
}

export const PremiumBattleLogs = (props: PremiumBattleLogsProps) => {
  return (
    <div>
      <LogWinRates logs={props.logs} />
    </div>
  )
}