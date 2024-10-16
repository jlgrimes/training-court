
import Link from "next/link";
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle, SmallCardHeader } from "../../ui/card";
import { displayTournamentDate, getRecord } from "../utils/tournaments.utils";
import { fetchRounds } from "../utils/tournaments.server.utils";
import { EditableTournamentArchetype } from "@/components/archetype/AddArchetype/AddTournamentArchetype";
import { Database } from "@/database.types";
import { formatDistanceToNowStrict, isAfter, isBefore } from "date-fns";
import { RadioTower, Watch } from "lucide-react";
import { TournamentCategoryBadge } from "../Category/TournamentCategoryBadge";
import { TournamentCategory } from "../Category/tournament-category.types";
import { TournamentPlacementBadge } from "../Placement/TournamentPlacementBadge";
import { renderTournamentPlacement, TournamentPlacement } from "../Placement/tournament-placement.types";
import { Sprite } from "@/components/archetype/sprites/Sprite";
import { Label } from "@/components/ui/label";
import { TournamentCategoryIcon } from "../Category/TournamentCategoryIcon";

interface TournamentPreviewProps {
  tournament: Database['public']['Tables']['tournaments']['Row'];
  rounds: Database['public']['Tables']['tournament rounds']['Row'][];
  shouldHideCategoryBadge?: boolean;
}

// badges dead code
{/* <div className="flex gap-1 flex-col sm:flex-row">
  {isBefore(new Date(), props.tournament.date_from) && (
    <Badge className="bg-purple-100" variant='secondary'><Watch className="h-4 w-4 mr-1" /> Live in {formatDistanceToNowStrict(props.tournament.date_from, {
      roundingMethod: 'ceil',
      unit: 'day'
    })}</Badge>
  )}
  {isAfter(new Date(), props.tournament.date_from) && isBefore(new Date(), props.tournament.date_to) && (
    <Badge className="bg-green-100" variant='secondary'><RadioTower className="h-4 w-4 mr-1" /> Live</Badge>
  )}
</div> */}

export default async function TournamentPreview(props: TournamentPreviewProps) {
  return (
    <Link href={`/tournaments/${props.tournament.id}`}>
      <Card clickable>
        <SmallCardHeader>
            <div className="grid grid-cols-4 items-center">
              <Sprite name={props.tournament.deck} />
              <div className="text-left col-span-2">
                <CardTitle>{props.tournament.name}</CardTitle>
                <CardDescription>
                  {displayTournamentDate(props.tournament.date_from, props.tournament.date_to)}
                </CardDescription>
              </div>
              <div className="flex flex-col items-end">
                <CardTitle className="text-right whitespace-nowrap text-lg">{props.rounds && getRecord(props.rounds)}</CardTitle>
                {props.tournament.placement && <Label className="text-muted-foreground">{renderTournamentPlacement(props.tournament.placement as TournamentPlacement)}</Label>}
              </div>
            </div>
        </SmallCardHeader>
      </Card>
    </Link>
  )
}