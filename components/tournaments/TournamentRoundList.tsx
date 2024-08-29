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
import { fetchRounds } from "./tournaments.utils";

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
          <TableRow>
            <TableCell className="font-medium">{round.round_num}</TableCell>
            <TableCell><Sprite name={round.deck} /></TableCell>
            <TableCell className="text-right">{round.result as string}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}