'use client';

import { Database } from "@/database.types";
import { TournamentRound } from "./TournamentRound";
import { useCallback, useState } from "react";

interface TournamentRoundListProps {
  tournament: Database['public']['Tables']['tournaments']['Row'];
  userId: string | undefined;
  rounds: Database['public']['Tables']['tournament rounds']['Row'][];
  updateClientRoundsOnEdit: (
    newRound: Database['public']['Tables']['tournament rounds']['Row'],
    pos: number
  ) => void;
  roundsTableName?: string;
  hatType?: string | null;
}

export default function TournamentRoundList(props: TournamentRoundListProps) {
  const [editingRoundIdx, setEditingRoundIdx] = useState<number | null>(null);
  const handleEditingRoundToggle = useCallback((roundIdx: number) => {
    setEditingRoundIdx(prev => (roundIdx === prev ? null : roundIdx));
  }, []);

  const rounds = props.rounds ?? [];

  return (
    <div className="max-h-[65vh] overflow-y-auto overflow-x-hidden md:max-h-[70vh]">
      <div className="grid grid-cols-8">
        <div className="col-span-8 grid grid-cols-8 px-3 py-1 text-sm font-medium text-muted-foreground sticky top-0 z-10 bg-background border-b">
          <span className="col-span-2">Round</span>
          <span className="col-span-5">Deck</span>
          <span className="col-span-1 text-right">Result</span>
        </div>

        {rounds.map((round, idx) => (
          <TournamentRound
            key={round.id}
            tournament={props.tournament}
            userId={props.userId}
            round={round}
            updateClientRoundsOnEdit={props.updateClientRoundsOnEdit}
            isEditing={editingRoundIdx === idx}
            handleEditingRoundToggle={() => handleEditingRoundToggle(idx)}
            roundsTableName={props.roundsTableName}
            hatType={props.hatType}
          />
        ))}
      </div>
    </div>
  );
}
