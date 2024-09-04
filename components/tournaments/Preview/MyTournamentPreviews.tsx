import { createClient } from "@/utils/supabase/server";
import { User } from "@supabase/supabase-js";
import TournamentPreview from "./TournamentPreview";

interface MyTournamentPreviewsProps {
  user: User | null;
}

export async function MyTournamentPreviews (props: MyTournamentPreviewsProps) {
  const supabase = createClient();
  const { data: tournamentData } = await supabase.from('tournaments').select('*').eq('user', props.user?.id).order('date_from', { ascending: false });

  return (
    <div className="flex flex-col gap-2">
      {tournamentData?.map((tournament) => (
        <TournamentPreview tournament={tournament}/>
      ))}
    </div>
  )
}