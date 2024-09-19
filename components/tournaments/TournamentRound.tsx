'use client';

import { Sprite } from "../archetype/Sprite";
import { convertGameResultsToRoundResult } from "./utils/tournaments.utils";
import { Database } from "@/database.types";
import { useMemo, useState } from "react";
import TournamentRoundEdit from "./AddTournamentRound/TournamentRoundEdit";
import { cn } from "@/lib/utils";

interface TournamentRoundProps {
  tournament: Database['public']['Tables']['tournaments']['Row'];
  userId: string | undefined;
  round: Database['public']['Tables']['tournament rounds']['Row'];
  updateClientRoundsOnEdit: (newRound: Database['public']['Tables']['tournament rounds']['Row'], pos: number) => void;
}

export const TournamentRound = (props: TournamentRoundProps) => {
  const userHasPermissionsToEdit = useMemo(() => props.userId === props.tournament.user, [props.userId, props.tournament.user]);
  const result = useMemo(() => convertGameResultsToRoundResult(props.round.result), [convertGameResultsToRoundResult, props.round.result]);
  const deck: string[] = props.round.deck ?? [];

  const [isEditing, setIsEditing] = useState(false);

  if (props.userId && isEditing) {
    return (
      <div className="col-span-8">
        <TournamentRoundEdit
          tournamentId={props.tournament.id}
          userId={props.userId}
          editedRoundNumber={props.round.round_num}
          existingRound={props.round}
          updateClientRounds={(updatedRound) => props.updateClientRoundsOnEdit(updatedRound, props.round.round_num - 1)}
          editing={isEditing}
          setEditing={setIsEditing}
        />
      </div>
    );
  }

  return (
    <div
      onClick={() => userHasPermissionsToEdit && setIsEditing(true)}
      className={cn(
        'col-span-8 grid grid-cols-8 items-center px-4 border-b h-12',
        userHasPermissionsToEdit && 'cursor-pointer',
        result === 'W' && 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200',
        result === 'T' && 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200',
        result === 'L' && 'bg-red-100 text-red-600 hover:bg-red-200',
      )}
    >
      <span className="col-span-2 font-bold text-sm">{props.round.round_num}</span>
      <span className="col-span-5">
        {props.round.match_end_reason === 'ID' ? (
          <div className="flex items-center font-bold text-lg ml-2">ID</div>
        ) : props.round.match_end_reason === 'No show' ? (
          <div className="flex items-center text-sm font-bold">No show</div>
        ) : (
          <div className="flex items-center w-8 h-8">
            {deck ? (
              JSON.parse(deck).filter((sprite: string) => sprite !== "" && sprite.trim()).map((spriteName: string, index: number) => (
                <Sprite key={index} name={spriteName} />
              ))
            ) : (
              <div>No sprites available</div>
            )}
          </div>
        )}
      </span>
      <span className="text-right font-bold tracking-wider text-md leading-4">
        {props.round.result.join('')}
      </span>
    </div>
  );
};
