
import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { displayTournamentDate, getRecord } from "../utils/tournaments.utils";
import { Sprite } from "../../archetype/Sprite";
import { fetchRounds } from "../utils/tournaments.server.utils";
import { EditableTournamentArchetype } from "@/components/archetype/AddArchetype/AddTournamentArchetype";
import { Database } from "@/database.types";

interface TournamentPreviewProps {
  tournament: Database['public']['Tables']['tournaments']['Row'];
}

export default async function TournamentPreview(props: TournamentPreviewProps) {
  const rounds = await fetchRounds(props.tournament.id);

  return (
    <Link href={`/tournament/${props.tournament.id}`}>
      <Card clickable>
        <CardHeader className="grid grid-cols-6 items-center">
          <div className="grid-cols-1">
            <EditableTournamentArchetype tournament={props.tournament} editDisabled />
          </div>
          <div className="col-span-4 grid-cols-5">
            <CardTitle>{props.tournament.name}</CardTitle>
            <CardDescription className="grid gap-4">
              {displayTournamentDate(props.tournament.date_from, props.tournament.date_to)}
            </CardDescription>
          </div>
          <CardTitle className="text-right">{rounds && getRecord(rounds)}</CardTitle>
        </CardHeader>
      </Card>
    </Link>
  )
}