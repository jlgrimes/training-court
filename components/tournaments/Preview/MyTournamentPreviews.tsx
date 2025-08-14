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
import MultiSelect from "@/components/ui/multi-select";

interface MyTournamentPreviewsProps {
  user: User | null;
}

export function MyTournamentPreviews (props: MyTournamentPreviewsProps) {
  const { data: tournaments } = useTournaments(props.user?.id);
  const { data: rounds } = useTournamentRounds(props.user?.id);

  // @TODO: Known issue on mobile aka a ghostClick. If clicking on a dropdown menu option, it will pass-through and click the tournament underneath.
  // The code relating to dropdown is one StackOverflow suggestion to fix this behavior. Behavior is fine on desktop.
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isInteractionBlocked, setIsInteractionBlocked] = useState(false);
  const [selectedCats, setSelectedCats] = useState<TournamentCategoryTab[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<TournamentFormatsTab>('All');

  const handleDropdownOpenChange = (open: boolean) => {
    setIsDropdownOpen(open);
    if (!open) {
      setIsInteractionBlocked(true);
      setTimeout(() => setIsInteractionBlocked(false), 300);
    }
  };
  
  const availableTournamentCategories = useMemo(() =>
    allTournamentCategoryTabs.filter((cat) => cat !== 'all')
      .map((cat) => ({
        value: cat,
        label: `${displayTournamentCategoryTab(cat)} (${
          tournaments?.filter((t) => t.category === cat).length ?? 0
        })`,
        icon: <TournamentCategoryIcon category={cat} />
      })),
    [allTournamentCategoryTabs, tournaments]
  );

  const availableFormats: TournamentFormatsTab[] = ['All'];
  tournaments?.forEach((tournament) => {
    if (tournament.format && !availableFormats.includes(tournament.format as TournamentFormatsTab)) {
      availableFormats.push(tournament.format as TournamentFormatsTab);
    }
  });

  const filteredTournaments = tournaments?.filter((tournament) =>
    (selectedCats.length === 0 || selectedCats.includes(tournament.category as TournamentCategoryTab))
    && (selectedFormat === 'All' || tournament.format === selectedFormat)
  );

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


  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">

        <MultiSelect
          options={availableTournamentCategories}
          value={selectedCats}
          onChange={(vals) => setSelectedCats(vals as TournamentCategoryTab[])}
          placeholder="Select category"
        />

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

      <div className={isInteractionBlocked ? 'pointer-events-none' : ''}>
        {filteredTournaments?.length === 0 && (
          <Card className="border-none">
            <CardHeader className="px-2">
              <CardDescription>No tournaments found for the selected category and format.</CardDescription>
            </CardHeader>
          </Card>
        )}

        {selectedCats.length === 0 ? (
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
          <ScrollArea className="h-[36rem]">
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
    </div>
  );
}
