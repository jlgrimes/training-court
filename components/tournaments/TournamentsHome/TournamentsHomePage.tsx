import { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import TournamentCreate from "../TournamentCreate"
import { MyTournamentPreviews } from "../Preview/MyTournamentPreviews";
import { fetchRoundsForUser } from "../utils/tournaments.server.utils";
import { Database } from "@/database.types";
import { isPremiumUser } from "@/components/premium/premium.utils";
import { Matchups } from "@/components/premium/matchups/Matchups";
import { convertTournamentsToMatchups } from "@/components/premium/matchups/Matchups.utils";

interface TournamentsHomePageProps {
  user: User;
}

export const TournamentsHomePage = async (props: TournamentsHomePageProps) => {
  const supabase = createClient();
  const { data: tournamentData } = await supabase.from('tournaments').select('*').eq('user', props.user?.id).order('date_from', { ascending: false }).returns<Database['public']['Tables']['tournaments']['Row'][]>();
  const rounds = await fetchRoundsForUser(props.user?.id);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="flex flex-col gap-4">
        <TournamentCreate userId={props.user.id} />
        <MyTournamentPreviews user={props.user} tournaments={tournamentData} rounds={rounds} />
      </div>
       
      <div className="flex flex-col">
        {isPremiumUser(props.user.id) && tournamentData && rounds && <Matchups matchups={convertTournamentsToMatchups(tournamentData, rounds)} userId={props.user.id}/>}
      </div>
    </div>
  );
}