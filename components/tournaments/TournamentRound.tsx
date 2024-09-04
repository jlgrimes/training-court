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

interface TournamentRoundProps {
  round: Database['public']['Tables']['tournament rounds']['Row'];
}

export const TournamentRound = (props: TournamentRoundProps) => {
  return (
    <TableRow result={convertGameResultsToRoundResult(props.round.result)}>
      <TableCell className="font-medium py-2">{props.round.round_num}</TableCell>
      <TableCell className="py-2">{props.round.is_id ? <div className="flex items-center font-bold">
      <HandshakeIcon className="mr-2 h-4 w-4" />
      ID
      </div> : <Sprite name={props.round.deck} />}</TableCell>
      <TableCell className="text-right font-bold tracking-wider text-md leading-4">{props.round.result.join('')}</TableCell>
    </TableRow>
  )
}