'use client';

import { useState } from "react";
import { Button } from "../../ui/button";
import { Plus } from "lucide-react";
import { Database } from "@/database.types";
import TournamentRoundEdit from "./TournamentRoundEdit";

export interface AddTournamentRoundProps {
  tournamentId: string;
  userId: string;
  editedRoundNumber: number;
  updateClientRounds: (newRound: Database['public']['Tables']['tournament rounds']['Row']) => void
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
    />
  )

  return (
    <Button size='sm' variant={'secondary'} onClick={() => setEditing(true)}>
      <Plus className="mr-2 h-4 w-4" />Add round
    </Button>
  )
}