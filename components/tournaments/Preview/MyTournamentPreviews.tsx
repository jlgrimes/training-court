'use client';

import { User } from "@supabase/supabase-js";
import TournamentPreview from "./TournamentPreview";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TournamentCategory, TournamentCategoryTab, allTournamentCategoryTabs, displayTournamentCategoryTab } from "../Category/tournament-category.types";
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

  const [isInteractionBlocked, ] = useState(false);
  const [selectedCats, setSelectedCats] = useState<TournamentCategoryTab[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<TournamentFormatsTab[]>([]);

    const formatMatches = (fmt?: string | null) => {
    if (!selectedFormat || selectedFormat.length === 0) return true;
    if (selectedFormat.includes('All')) return true;
    if (!fmt) return false;
    return selectedFormat.includes(fmt as TournamentFormatsTab);
  };

  const availableTournamentCategories = useMemo(() => {
    return allTournamentCategoryTabs
      .filter((cat) => cat !== 'all')
      .map((cat) => {
        const count = (tournaments ?? []).filter(
          (t) => t.category === cat && formatMatches(t.format)
        ).length;

        return {
          value: cat,
          label: `${displayTournamentCategoryTab(cat)} (${count})`,
          icon: <TournamentCategoryIcon category={cat as TournamentCategory} />
        };
      });
  }, [tournaments, selectedFormat]);

    const availableFormatOptions = useMemo(() => {
    const formats = new Set<TournamentFormatsTab>([]);
    (tournaments ?? []).forEach((t) => {
      if (t.format) formats.add(t.format as TournamentFormatsTab);
    });

    return Array.from(formats).map((format) => {
      const count = (tournaments ?? []).filter((t) =>
        format === 'All' ? true : t.format === format
      ).length;

      return {
        value: format,
        label: `${format === 'All' ? 'All Formats' : format} (${count})`
      };
    });
  }, [tournaments]);

  const filteredTournaments = useMemo(() => {
    return (tournaments ?? []).filter((tournament) => {
      const catOk =
        selectedCats.length === 0 ||
        selectedCats.includes(tournament.category as TournamentCategoryTab);

      const formatOk = formatMatches(tournament.format);

      return catOk && formatOk;
    });
  }, [tournaments, selectedCats, selectedFormat]);

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
          placeholder="All Categories"
        />

        <MultiSelect
          options={availableFormatOptions}
          value={selectedFormat}
          onChange={(vals) => setSelectedFormat(vals as TournamentFormatsTab[])}
          placeholder="All Formats"
        />
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
