import { createClient } from "@/utils/supabase/server";
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
import { convertGameResultsToRoundResult, fetchRounds } from "./utils/tournaments.utils";
import { HandshakeIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function TournamentRoundList ({ tournamentId }: { tournamentId: string }) {
  const rounds = await fetchRounds(tournamentId);

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
        {rounds?.map((round) => (
          <TableRow className={cn(
            (convertGameResultsToRoundResult(round.result) === 'W') && 'bg-green-100 text-green-700',
            (convertGameResultsToRoundResult(round.result) === 'L') && 'bg-red-100 text-red-700',
            (convertGameResultsToRoundResult(round.result) === 'T') && 'bg-yellow-100 text-yellow-700',
          )}>
            <TableCell className="font-medium py-2">{round.round_num}</TableCell>
            <TableCell className="py-2">{round.is_id ? <div className="flex items-center">
            <HandshakeIcon className="mr-2 h-4 w-4" />
            ID
            </div> : <Sprite name={round.deck} />}</TableCell>
            <TableCell className="text-right font-bold text-md">{round.result as string}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}