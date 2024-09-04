'use client';

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Database } from "@/database.types";
import { TournamentRound } from "./TournamentRound";

interface TournamentRoundListProps {
  tournament: Database['public']['Tables']['tournaments']['Row'];
  userId: string | undefined;
  rounds: Database['public']['Tables']['tournament rounds']['Row'][];
  updateClientRoundsOnEdit: (newRound: Database['public']['Tables']['tournament rounds']['Row'], pos: number) => void;
}

export default function TournamentRoundList (props: TournamentRoundListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Round</TableHead>
          <TableHead>Deck</TableHead>
          <TableHead className="text-right">Result</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.rounds?.map((round) => (
          <TournamentRound
            tournament={props.tournament}
            userId={props.userId}
            round={round}
            updateClientRoundsOnEdit={props.updateClientRoundsOnEdit}
          />
        ))}
      </TableBody>
    </Table>
  )
}