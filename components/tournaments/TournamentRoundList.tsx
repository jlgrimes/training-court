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
import { Sprite } from "../archetype/Sprite";
import { convertGameResultsToRoundResult } from "./utils/tournaments.utils";
import { HandshakeIcon } from "lucide-react";
import { Database } from "@/database.types";
import { TournamentRound } from "./TournamentRound";

interface TournamentRoundListProps {
  rounds: Database['public']['Tables']['tournament rounds']['Row'][];
  updateClientRoundsOnEdit: (newRound: Database['public']['Tables']['tournament rounds']['Row'], pos: number) => void;
  userHasPermissionsToEdit: boolean;
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
          <TournamentRound round={round}/>
        ))}
      </TableBody>
    </Table>
  )
}