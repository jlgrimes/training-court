'use client';

import { ToggleGroup } from "@/components/ui/toggle-group";
import { ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { tournamentFormats } from "@/components/tournaments/Format/tournament-format.types";
import { formatFilterAtom, sourceFilterAtom, turnOrderFilterAtom } from "./recoil-matchups/deckMatchupAtom";
import { useRecoilState } from "recoil";

export const MatchupsFilterBar = () => {
  const [sourceFilter, setSourceFilter] = useRecoilState(sourceFilterAtom);
  const [formatFilter, setFormatFilter] = useRecoilState(formatFilterAtom);
  const [turnOrderFilter, setTurnOrderFilter] = useRecoilState(turnOrderFilterAtom);

  return (
    <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
      <ToggleGroup
        type="multiple"
        variant="outline"
        value={turnOrderFilter}
        onValueChange={setTurnOrderFilter}
      >
        <ToggleGroupItem
          value="1"
          aria-label="First"
          className="
            font-medium rounded-lg
            border border-transparent
            data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:border-primary
            transition-colors
            hover:bg-transparent hover:no-underline
            h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm
          ">
          1st
        </ToggleGroupItem>
        <ToggleGroupItem
          value="2"
          aria-label="Second"
          className="
            font-medium rounded-lg
            border border-transparent
            data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:border-primary
            transition-colors
            hover:bg-transparent hover:no-underline
            h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm
          ">
          2nd
        </ToggleGroupItem>
      </ToggleGroup>

      <ToggleGroup
        type="multiple"
        variant="outline"
        value={sourceFilter}
        onValueChange={(val) => setSourceFilter(val)}
      >
        <ToggleGroupItem
          value="Battle Logs"
          aria-label="Battle Logs"
          className="
            font-medium rounded-lg
            border border-transparent
            data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:border-primary
            transition-colors
            hover:bg-transparent hover:no-underline
            h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm
          ">
          Logs
        </ToggleGroupItem>

        <ToggleGroupItem
          value="Tournament Rounds"
          aria-label="Tournament Rounds"
          className="
            font-medium rounded-lg
            border border-transparent
            data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:border-primary
            transition-colors
            hover:bg-transparent hover:no-underline
            h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm
          ">
          Tournaments
        </ToggleGroupItem>
      </ToggleGroup>

      <Select onValueChange={(val) => setFormatFilter(val)} value={formatFilter ?? undefined}>
        <SelectTrigger className="w-[120px] sm:w-[180px]">
          <SelectValue placeholder="All formats" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={"All"}>All formats</SelectItem>
          {tournamentFormats.map((format) => (
            <SelectItem key={format} value={format}>
              {format}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
