'use client';

import Link from 'next/link';
import { Card, CardDescription, CardTitle, SmallCardHeader } from '@/components/ui/card';
import { displayTournamentDate, getRecord } from '@/components/tournaments/utils/tournaments.utils';
import { renderTournamentPlacement, TournamentPlacement } from '@/components/tournaments/Placement/tournament-placement.types';
import { Sprite } from '@/components/archetype/sprites/Sprite';

type PocketTournament = {
  id: string;
  name: string;
  date_from: string;
  date_to: string;
  deck: string | null;
  placement: string | null;
};

type PocketRound = {
  id: string;
  tournament: string;
  result: string[];
};

interface PocketTournamentPreviewProps {
  tournament: PocketTournament;
  rounds: PocketRound[];
}

export default function PocketTournamentPreview(props: PocketTournamentPreviewProps) {
  return (
    <Link href={`/pocket/tournaments/${props.tournament.id}`}>
      <Card clickable>
        <SmallCardHeader>
          <div className='grid grid-cols-two-sprite+3 items-center'>
            <Sprite name={props.tournament.deck ?? ''} />
            <div className='text-left col-span-2'>
              <CardTitle className='dark:text-white'>{props.tournament.name}</CardTitle>
              <CardDescription>
                {displayTournamentDate(props.tournament.date_from, props.tournament.date_to)}
              </CardDescription>
            </div>
            <div className='flex flex-col items-end'>
              <CardTitle className='text-right whitespace-nowrap dark:text-white'>
                {props.rounds && getRecord(props.rounds)}
              </CardTitle>
              {props.tournament.placement && (
                <CardDescription>
                  {renderTournamentPlacement(props.tournament.placement as TournamentPlacement)}
                </CardDescription>
              )}
            </div>
          </div>
        </SmallCardHeader>
      </Card>
    </Link>
  );
}
