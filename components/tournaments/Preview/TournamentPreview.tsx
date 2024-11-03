'use client';

import Link from "next/link";
import { Card, CardDescription, CardTitle, SmallCardHeader } from "../../ui/card";
import { displayTournamentDate, getRecord } from "../utils/tournaments.utils";
import { Database } from "@/database.types";
import { renderTournamentPlacement, TournamentPlacement } from "../Placement/tournament-placement.types";
import { Sprite } from "@/components/archetype/sprites/Sprite";
import { Label } from "@/components/ui/label";

interface TournamentPreviewProps {
  tournament: Database['public']['Tables']['tournaments']['Row'];
  rounds: Database['public']['Tables']['tournament rounds']['Row'][];
  shouldHideCategoryBadge?: boolean;
}

export default function TournamentPreview(props: TournamentPreviewProps) {
  return (
    <Link href={`/tournaments/${props.tournament.id}`}>
      <Card clickable>
        <SmallCardHeader>
          <div className="grid grid-cols-two-sprite+3 items-center">
            <Sprite name={props.tournament.deck} />
            <div className="text-left col-span-2">
              <CardTitle>{props.tournament.name}</CardTitle>
              <CardDescription>
                {displayTournamentDate(props.tournament.date_from, props.tournament.date_to)}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end">
              <CardTitle className="text-right whitespace-nowrap text-lg">{props.rounds && getRecord(props.rounds)}</CardTitle>
              {props.tournament.placement && <Label className="text-muted-foreground text-right">{renderTournamentPlacement(props.tournament.placement as TournamentPlacement)}</Label>}
            </div>
          </div>
        </SmallCardHeader>
      </Card>
    </Link>
  )
}