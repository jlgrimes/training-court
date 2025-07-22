
import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/server";
import { YourMatchups } from "./YourMatchups";

interface PremiumTournamentChartsProps {
  userId: string;
}

export const PremiumTournamentCharts = async (props: PremiumTournamentChartsProps) => {
  const supabase = createClient();
  // TODO: This RPC function doesn't exist in the current database schema
  const data: any[] = [];
  const error = null;

  return (
    <div>
      <YourMatchups matchupData={data} />
    </div>
  )
}