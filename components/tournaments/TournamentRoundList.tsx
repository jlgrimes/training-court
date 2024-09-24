'use client';

import { Database } from "@/database.types";
import { TournamentRound } from "./TournamentRound";
import { useCallback, useState } from "react";

interface TournamentRoundListProps {
  tournament: Database['public']['Tables']['tournaments']['Row'];
  userId: string | undefined;
  rounds: Database['public']['Tables']['tournament rounds']['Row'][];
  updateClientRoundsOnEdit: (newRound: Database['public']['Tables']['tournament rounds']['Row'], pos: number) => void;
}

export default function TournamentRoundList (props: TournamentRoundListProps) {
  const [editingRoundIdx, setEditingRoundIdx] = useState<number | null>(null);

  const handleEditingRoundToggle = useCallback((roundIdx: number) => {
    // this function seems pointless, but when we add the close button it will matter
    setEditingRoundIdx(roundIdx)
  }, [editingRoundIdx, setEditingRoundIdx]);

  return (
    <div className="grid grid-cols-8">
      <div className="col-span-8 grid grid-cols-8 text-sm font-medium text-muted-foreground px-3 py-1">
        <span className="col-span-2">Round</span>
        <span className="col-span-5">Deck</span>
        <span className="col-span-1 text-right">Result</span>
      </div>
      {props.rounds?.map((round, idx) => (
        <TournamentRound
          key={round.id}
          tournament={props.tournament}
          userId={props.userId}
          round={round}
          updateClientRoundsOnEdit={props.updateClientRoundsOnEdit}
          isEditing={editingRoundIdx === idx}
          handleEditingRoundToggle={() => handleEditingRoundToggle(idx)}
        />
      ))}
    </div>
  )
}