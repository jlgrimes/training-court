'use client';

import Link from "next/link";
import { Card, CardDescription, CardTitle, SmallCardHeader } from "../../ui/card";
import { displayTournamentDate, getRecord } from "../utils/tournaments.utils";
import { Database } from "@/database.types";
import { renderTournamentPlacement, TournamentPlacement } from "../Placement/tournament-placement.types";
import { Sprite } from "@/components/archetype/sprites/Sprite";

interface TournamentPreviewProps {
  tournament: Database['public']['Tables']['tournaments']['Row'];
  rounds: Database['public']['Tables']['tournament rounds']['Row'][];
  shouldHideCategoryBadge?: boolean;
  basePath?: string;
  hatType?: string | null;
}

export default function TournamentPreview(props: TournamentPreviewProps) {
  const basePath = props.basePath ?? '/tournaments';
  return (
    <Link href={`${basePath}/${props.tournament.id}`}>
      <Card clickable>
        <SmallCardHeader>
          <div className="grid grid-cols-two-sprite+3 items-center">
            <Sprite name={props.tournament.deck} hatType={props.hatType ?? props.tournament.hat_type ?? undefined} />
            <div className="text-left col-span-2">
              <CardTitle className="dark:text-white">{props.tournament.name}</CardTitle>
              <CardDescription>
                {displayTournamentDate(props.tournament.date_from, props.tournament.date_to)}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end">
              <CardTitle className="text-right whitespace-nowrap dark:text-white">{props.rounds && getRecord(props.rounds)}</CardTitle>
              {props.tournament.placement && <CardDescription>{renderTournamentPlacement(props.tournament.placement as TournamentPlacement)}</CardDescription>}
            </div>
          </div>
        </SmallCardHeader>
      </Card>
    </Link>
  )
}
