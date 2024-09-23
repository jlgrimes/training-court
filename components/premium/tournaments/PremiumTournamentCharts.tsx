
import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/server";
import { YourMatchups } from "./YourMatchups";

interface PremiumTournamentChartsProps {
  userId: string;
}

export const PremiumTournamentCharts = async (props: PremiumTournamentChartsProps) => {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('getusertournamentresults', { userid: props.userId }).returns<Database['public']['Functions']['getusertournamentresults']['Returns']>()

  return (
    <div>
      <YourMatchups matchupData={data} />
    </div>
  )
}