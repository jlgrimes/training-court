import { createClient } from "@/utils/supabase/server";
import { User } from "@supabase/supabase-js";
import TournamentPreview from "./TournamentPreview";

interface MyTournamentPreviewsProps {
  user: User | null;
}

export async function MyTournamentPreviews (props: MyTournamentPreviewsProps) {
  const supabase = createClient();
  const { data: tournamentData } = await supabase.from('tournaments').select('id,name,date_from,date_to,deck').eq('user', props.user?.id);

  return (
    <div className="flex flex-col gap-2">
      {tournamentData?.map((tournament) => (
        <TournamentPreview id={tournament.id} name={tournament.name} date_from={tournament.date_from} date_to={tournament.date_to} deck={tournament.deck}/>
      ))}
    </div>
  )
}