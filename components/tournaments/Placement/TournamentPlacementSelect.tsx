"use client"

import * as React from "react"
import { TournamentPlacement, renderTournamentPlacement } from "./tournament-placement.types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const placements: TournamentPlacement[] = ['no placement', 'dropped', 't1024', 't512', 't256', 't128', 't64', 't32', 't16', 't8', 't4', 'finalist', 'champion'];

interface TournamentPlacementSelectProps {
  value: TournamentPlacement | null;
  onChange: (newValue: TournamentPlacement) => void;
}

export function TournamentPlacementSelect(props: TournamentPlacementSelectProps) {
  return (
    <Select value={props.value ?? undefined} onValueChange={props.onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Add tournament placement" />
      </SelectTrigger>
      <SelectContent>
        {placements.map((placement) => (
          <SelectItem key={placement} value={placement}>{renderTournamentPlacement(placement)}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
