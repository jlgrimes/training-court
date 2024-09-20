
import Link from "next/link";
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardTitle, SmallCardHeader } from "../../ui/card";
import { displayTournamentDate, getRecord } from "../utils/tournaments.utils";
import { fetchRounds } from "../utils/tournaments.server.utils";
import { EditableTournamentArchetype } from "@/components/archetype/AddArchetype/AddTournamentArchetype";
import { Database } from "@/database.types";
import { formatDistanceToNowStrict, isAfter, isBefore } from "date-fns";
import { RadioTower, Watch } from "lucide-react";
import { TournamentCategoryBadge } from "../Category/TournamentCategoryBadge";
import { TournamentCategory } from "../Category/tournament-category.types";

interface TournamentPreviewProps {
  tournament: Database['public']['Tables']['tournaments']['Row'];
  shouldHideCategoryBadge?: boolean;
}

export default async function TournamentPreview(props: TournamentPreviewProps) {
  const rounds = await fetchRounds(props.tournament.id);

  return (
    <Link href={`/tournament/${props.tournament.id}`}>
      <Card clickable>
        <SmallCardHeader className="grid grid-cols-6 items-center">
          <div className="grid-cols-1">
            <EditableTournamentArchetype tournament={props.tournament} editDisabled />
          </div>
          <div className="col-span-4 grid-cols-5">
            <CardTitle>{props.tournament.name}</CardTitle>
            <CardDescription className="grid gap-4">
              {displayTournamentDate(props.tournament.date_from, props.tournament.date_to)}
            </CardDescription>
            <div className="flex gap-1">
              {props.tournament.category && !props.shouldHideCategoryBadge && <TournamentCategoryBadge category={props.tournament.category as TournamentCategory} />}
              {isBefore(new Date(), props.tournament.date_from) && (
                <Badge className="mt-2 bg-purple-100" variant='secondary'><Watch className="h-4 w-4 mr-1" /> Live in {formatDistanceToNowStrict(props.tournament.date_from, {
                  roundingMethod: 'ceil',
                  unit: 'day'
                })}</Badge>
              )}
              {isAfter(new Date(), props.tournament.date_from) && isBefore(new Date(), props.tournament.date_to) && (
                <Badge className="mt-2 bg-green-100" variant='secondary'><RadioTower className="h-4 w-4 mr-1" /> Live</Badge>
              )}
            </div>
          </div>
          <CardTitle className="text-right">{rounds && getRecord(rounds)}</CardTitle>
        </SmallCardHeader>
      </Card>
    </Link>
  )
}