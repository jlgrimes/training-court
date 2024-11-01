'use client';

import { User } from "@supabase/supabase-js";
import TournamentPreview from "./TournamentPreview";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TournamentCategoryTab, allTournamentCategoryTabs, displayTournamentCategoryTab } from "../Category/tournament-category.types";
import { Database } from "@/database.types";
import { TournamentCategoryIcon } from "../Category/TournamentCategoryIcon";
import { getTournamentRoundsFromUserRounds } from "../utils/tournaments.utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { TournamentFormatTab } from "../Format/tournament-format.types";

interface MyTournamentPreviewsProps {
  user: User | null;
  tournaments: Database['public']['Tables']['tournaments']['Row'][] | null;
  rounds: Database['public']['Tables']['tournament rounds']['Row'][] | null;
}

export function MyTournamentPreviews(props: MyTournamentPreviewsProps) {
  const [selectedCat, setSelectedCat] = useState<TournamentCategoryTab>('all');
  const [selectedFormat, setSelectedFormat] = useState<TournamentFormatTab>('all');

  if (props.tournaments && props.tournaments.length === 0) {
    return (
      <Card className="border-none">
        <CardHeader className="px-2">
          <CardDescription>You can add tournaments from the past, present, or future.</CardDescription>
          <CardDescription>Click New Tournament to get started!</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const availableTournamentCategories: TournamentCategoryTab[] = allTournamentCategoryTabs.filter(
    (cat) => cat === 'all' || props.tournaments?.some((tournament) => tournament.category === cat)
  );

  const availableFormats: TournamentFormatTab[] = ['all'];
  props.tournaments?.forEach((tournament) => {
    if (tournament.format && !availableFormats.includes(tournament.format as TournamentFormatTab)) {
      availableFormats.push(tournament.format as TournamentFormatTab);
    }
  });

  const filteredTournaments = props.tournaments?.filter((tournament) =>
    (selectedCat === 'all' || tournament.category === selectedCat) &&
    (selectedFormat === 'all' || tournament.format === selectedFormat)
  );

  return (
    <div className="flex flex-col gap-2">
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
                  {props.tournaments?.filter((tournament) => cat === 'all' ? true : tournament.category === cat).length})
                </p>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select defaultValue="all" onValueChange={(val) => setSelectedFormat(val as TournamentFormatTab)}>
        <SelectTrigger>
          <SelectValue placeholder="Select format" />
        </SelectTrigger>
        <SelectContent>
          {availableFormats.map((format) => (
            <SelectItem key={format} value={format}>
              <div className="flex justify-between w-full items-center">
                <p>
                  {format === 'all' ? 'All Formats' : format} (
                  {props.tournaments?.filter((tournament) => format === 'all' ? true : tournament.format === format).length})
                </p>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
            props.rounds ? (
              <TournamentPreview
                key={tournament.id}
                tournament={tournament}
                rounds={getTournamentRoundsFromUserRounds(props.rounds, tournament)}
              />
            ) : null
          )}
        </div>
      ) : (
        <ScrollArea className="h-[36rem] pr-4">
          <div className="flex flex-col gap-2">
            {filteredTournaments?.map((tournament) =>
              props.rounds ? (
                <TournamentPreview
                  key={tournament.id}
                  tournament={tournament}
                  rounds={getTournamentRoundsFromUserRounds(props.rounds, tournament)}
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
