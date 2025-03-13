'use client';

import { User } from "@supabase/supabase-js";
import TournamentPreview from "./TournamentPreview";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TournamentCategoryTab, allTournamentCategoryTabs, displayTournamentCategoryTab } from "../Category/tournament-category.types";
import { TournamentCategoryIcon } from "../Category/TournamentCategoryIcon";
import { getTournamentRoundsFromUserRounds } from "../utils/tournaments.utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo, useState } from "react";
import { useTournaments } from "@/hooks/tournaments/useTournaments";
import { useTournamentRounds } from "@/hooks/tournaments/useTournamentRounds";
import { TournamentFormatsTab } from "../Format/tournament-format.types";

interface MyTournamentPreviewsProps {
  user: User | null;
}

export function MyTournamentPreviews (props: MyTournamentPreviewsProps) {
  const { data: tournaments } = useTournaments(props.user?.id);
  const { data: rounds } = useTournamentRounds(props.user?.id);

  const [selectedCat, setSelectedCat] = useState<TournamentCategoryTab>('all');
  const [selectedFormat, setSelectedFormat] = useState<TournamentFormatsTab>('All');

  if (tournaments && tournaments?.length === 0) {
    return (
      <Card className="border-none">
        <CardHeader className="px-2">
          <CardDescription>You can add tournaments from the past, present, or future.</CardDescription>
          <CardDescription>Click New Tournament to get started!</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const availableTournamentCategories = useMemo(() =>
    allTournamentCategoryTabs.filter(
      (cat) => cat === 'all' || tournaments?.some((tournament) => tournament.category === cat)
    ), 
    [allTournamentCategoryTabs, tournaments]
  );

  const availableFormats: TournamentFormatsTab[] = ['All'];
  tournaments?.forEach((tournament) => {
    if (tournament.format && !availableFormats.includes(tournament.format as TournamentFormatsTab)) {
      availableFormats.push(tournament.format as TournamentFormatsTab);
    }
  });

  const filteredTournaments = tournaments?.filter((tournament) =>
    (selectedCat === 'all' || tournament.category === selectedCat) &&
    (selectedFormat === 'All' || tournament.format === selectedFormat)
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">

      <Select defaultValue="all" onValueChange={(val) => setSelectedCat(val as TournamentCategoryTab)}>
        <SelectTrigger>
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          {availableTournamentCategories.map((cat) => (
            <SelectItem key={cat} value={cat}>
              <div className="flex justify-between w-full items-center">
                {cat !== 'all' && <TournamentCategoryIcon category={cat} />}
                <p>
                  {displayTournamentCategoryTab(cat)} (
                  {tournaments?.filter((tournament) => cat === 'all' ? true : tournament.category === cat).length})
                </p>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedFormat} onValueChange={(val) => setSelectedFormat(val as TournamentFormatsTab)}>
        <SelectTrigger>
          <SelectValue>{selectedFormat === 'All' ? 'All Formats' : selectedFormat}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableFormats.map((format) => (
            <SelectItem key={format} value={format}>
              <div className="flex justify-between w-full items-center">
                <p>
                  {format === 'All' ? 'All Formats' : format} (
                  {tournaments?.filter((tournament) => format === 'All' ? true : tournament.format === format).length})
                </p>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      </div>

      {filteredTournaments?.length === 0 && (
        <Card className="border-none">
          <CardHeader className="px-2">
            <CardDescription>No tournaments found for the selected category and format.</CardDescription>
          </CardHeader>
        </Card>
      )}

      {selectedCat === 'all' ? (
        <div className="flex flex-col gap-2">
          {filteredTournaments?.map((tournament) =>
            rounds ? (
              <TournamentPreview
                key={tournament.id}
                tournament={tournament}
                rounds={getTournamentRoundsFromUserRounds(rounds, tournament)}
              />
            ) : null
          )}
        </div>
      ) : (
        <ScrollArea className="h-[36rem] pr-4">
          <div className="flex flex-col gap-2">
            {filteredTournaments?.map((tournament) =>
              rounds ? (
                <TournamentPreview
                  key={tournament.id}
                  tournament={tournament}
                  rounds={getTournamentRoundsFromUserRounds(rounds, tournament)}
                  shouldHideCategoryBadge
                />
              ) : null
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
