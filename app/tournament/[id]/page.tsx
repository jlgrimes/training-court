import AddTournamentRound from "@/components/tournaments/AddTournamentRound";
import TournamentRoundList from "@/components/tournaments/TournamentRoundList";
import { createClient } from "@/utils/supabase/server";
import { format, formatDistanceToNowStrict } from "date-fns";
import { redirect } from "next/navigation";

export default async function TournamentPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: tournamentData } = await supabase.from('tournaments').select('id,name,date_from,date_to').eq('id', params.id).maybeSingle();

  if (!tournamentData ) {
    return redirect("/");
  }

  return (
    <div className="flex-1 flex flex-col w-full h-full p-8 sm:max-w-xl justify-between gap-2">
      <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-evenly w-full">
        <h1 className="scroll-m-20 text-3xl font-bold tracking-tight lg:text-4xl">{tournamentData.name}</h1>
        </div>
        <h3 className="text-sm text-muted-foreground">{format(tournamentData.date_from, "PPP")} - {format(tournamentData.date_to, "PPP")}</h3>
      </div>
        <div>
          <TournamentRoundList tournamentId={tournamentData.id} />
          <AddTournamentRound tournamentId={tournamentData.id} />
        </div>
      </div>
    </div>
  );
}
