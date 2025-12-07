'use client';

import Link from "next/link";
import { Card, CardDescription, CardTitle, SmallCardHeader } from "@/components/ui/card";
import { displayTournamentDate, getRecord } from "@/components/tournaments/utils/tournaments.utils";
import { renderTournamentPlacement, TournamentPlacement } from "@/components/tournaments/Placement/tournament-placement.types";
import { Sprite } from "@/components/archetype/sprites/Sprite";
import { PocketTournament, PocketTournamentRound } from "../pocket-tournaments.types";

interface PocketTournamentPreviewProps {
  tournament: PocketTournament;
  rounds: PocketTournamentRound[];
  hatType?: string | null;
}

export default function PocketTournamentPreview({ tournament, rounds, hatType }: PocketTournamentPreviewProps) {
  return (
    <Link href={`/pocket/tournaments/${tournament.id}`}>
      <Card clickable>
        <SmallCardHeader>
          <div className="grid grid-cols-two-sprite+3 items-center">
            <Sprite name={tournament.deck} hatType={hatType ?? tournament.hat_type ?? undefined} />
            <div className="text-left col-span-2">
              <CardTitle className="dark:text-white">{tournament.name}</CardTitle>
              <CardDescription>
                {displayTournamentDate(tournament.date_from, tournament.date_to)}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end">
              <CardTitle className="text-right whitespace-nowrap dark:text-white">{rounds && getRecord(rounds)}</CardTitle>
              {tournament.placement && <CardDescription>{renderTournamentPlacement(tournament.placement as TournamentPlacement)}</CardDescription>}
            </div>
          </div>
        </SmallCardHeader>
      </Card>
    </Link>
  )
}
