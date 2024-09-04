'use client';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { HandshakeIcon } from "lucide-react";
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
  const userHasPermissionsToEdit = useMemo(() => props.userId === props.tournament.user, [props.userId, props.tournament.user])

  const [isEditing, setIsEditing] = useState(false);

  if (props.userId && isEditing) {
    console.log(props.round)
    return (
      <TournamentRoundEdit
        tournamentId={props.tournament.id}
        userId={props.userId}
        editedRoundNumber={props.round.round_num}
        existingRound={props.round}
        updateClientRounds={(updatedRound) => props.updateClientRoundsOnEdit(updatedRound, props.round.round_num)}
        editing={isEditing}
        setEditing={setIsEditing}
      />
    )
  }

  return (
    <TableRow onClick={() => userHasPermissionsToEdit && setIsEditing(true)} className={cn(
      userHasPermissionsToEdit && 'cursor-pointer'
    )} result={convertGameResultsToRoundResult(props.round.result)}>
      <TableCell className="font-medium py-2">{props.round.round_num}</TableCell>
      <TableCell className="py-2">{props.round.match_end_reason === 'ID' ? <div className="flex items-center font-bold">
      <HandshakeIcon className="mr-2 h-4 w-4" />
      ID
      </div> : <Sprite name={props.round.deck} />}</TableCell>
      <TableCell className="text-right font-bold tracking-wider text-md leading-4">{props.round.result.join('')}</TableCell>
    </TableRow>
  )
}