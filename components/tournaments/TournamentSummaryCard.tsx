'use client';

import {
  Card,
  CardHeader,
} from "@/components/ui/card"
import { getRecord } from "./utils/tournaments.utils";

import { EditableTournamentArchetype } from "../archetype/AddArchetype/AddTournamentArchetype";
import { Database } from "@/database.types";

interface TournamentSummaryCardProps {
  tournament: Database['public']['Tables']['tournaments']['Row'];
  rounds: Database['public']['Tables']['tournament rounds']['Row'][];
}

export default function TournamentSummaryCard (props: TournamentSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="grid grid-cols-2 gap-4 items-center">
        <EditableTournamentArchetype tournament={props.tournament} />
        <h2 className="text-xl font-semibold tracking-wider">{getRecord(props.rounds)}</h2>
      </CardHeader>
    </Card>
  )
}