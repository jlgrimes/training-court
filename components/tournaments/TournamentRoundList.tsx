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

interface TournamentRoundListProps {
  rounds: Database['public']['Tables']['tournament rounds']['Row'][];
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
          <TableRow result={convertGameResultsToRoundResult(round.result)}>
            <TableCell className="font-medium py-2">{round.round_num}</TableCell>
            <TableCell className="py-2">{round.is_id ? <div className="flex items-center font-bold">
            <HandshakeIcon className="mr-2 h-4 w-4" />
            ID
            </div> : <Sprite name={round.deck} />}</TableCell>
            <TableCell className="text-right font-bold text-md">{round.result.join('')}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}