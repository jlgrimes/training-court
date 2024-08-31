import { Database } from "@/database.types"
import TournamentSummaryCard from "../TournamentSummaryCard"
import TournamentRoundList from "../TournamentRoundList";
import { User } from "@supabase/supabase-js";
import AddTournamentRound from "../AddTournamentRound/AddTournamentRound";
import { format } from "date-fns";

interface TournamentContainerClientProps {
  tournament: Database['public']['Tables']['tournaments']['Row'];
  rounds: Database['public']['Tables']['tournament rounds']['Row'][];
  user: User | undefined | null;
}

export const TournamentContainerClient = (props: TournamentContainerClientProps) => {
/**
 * TODO for when you get back:
 * - Define rounds state here, and pass it down client side, then when you add round, update it
 * - make it so "add round" can only add to the most recent round. Don't even think you need number picker. Making rounds editable is good enough
 */

  return (
    <div className="flex-1 flex flex-col w-full h-full p-8 sm:max-w-xl justify-between gap-2">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-evenly w-full">
            <h1 className="scroll-m-20 text-3xl font-bold tracking-tight lg:text-4xl">{props.tournament.name}</h1>
          </div>
            <h3 className="text-sm text-muted-foreground">{format(props.tournament.date_from, "PPP")} - {format(props.tournament.date_to, "PPP")}</h3>
          </div>
          <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            <TournamentSummaryCard tournament={props.tournament} rounds={props.rounds} />
            <TournamentRoundList rounds={props.rounds} />
            {props.user?.id && (props.user.id === props.tournament.user) && <AddTournamentRound tournamentId={props.tournament.id} userId={props.user.id} />}
          </div>
        </div>
      </div>
    </div>
  )
}