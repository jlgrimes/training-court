'use client';

import { useState } from "react";
import { Button } from "../../ui/button";
import { Plus } from "lucide-react";
import TournamentRoundEdit from "./TournamentRoundEdit";
import { TournamentRoundLike } from "@/lib/tournaments/types";

export interface AddTournamentRoundProps {
  tournamentId: string;
  userId: string;
  editedRoundNumber: number;
  updateClientRounds: (newRound: TournamentRoundLike) => void;
  roundsTable?: import('@/lib/tournaments/config').TournamentRoundsTableName;
}

export default function AddTournamentRound(props: AddTournamentRoundProps) {
  const [editing, setEditing] = useState(false);

  if (editing) return (
    <TournamentRoundEdit
      editing={editing}
      setEditing={setEditing}
      tournamentId={props.tournamentId}
      userId={props.userId}
      editedRoundNumber={props.editedRoundNumber}
      updateClientRounds={props.updateClientRounds}
      roundsTable={props.roundsTable}
    />
  )

  return (
    <Button size='sm' variant={'secondary'} onClick={() => setEditing(true)}>
      <Plus className="mr-2 h-4 w-4" />Add round
    </Button>
  )
}
