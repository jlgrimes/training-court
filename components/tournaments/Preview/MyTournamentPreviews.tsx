'use client';

import { User } from "@supabase/supabase-js";
import TournamentPreview from "./TournamentPreview";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TournamentCategory, TournamentCategoryTab, allTournamentCategoryTabs, displayTournamentCategoryTab } from "../Category/tournament-category.types";
import { TournamentCategoryIcon } from "../Category/TournamentCategoryIcon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import { useTournaments } from "@/hooks/tournaments/useTournaments";
import { useTournamentRounds } from "@/hooks/tournaments/useTournamentRounds";
import { TournamentFormatsTab } from "../Format/tournament-format.types";
import MultiSelect from "@/components/ui/multi-select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { T } from "gt-react";
import { Database } from "@/database.types";

interface MyTournamentPreviewsProps {
  user: User | null;
  basePath?: string;
}

const TOURNAMENT_PAGE_SIZE = 20;

export function MyTournamentPreviews (props: MyTournamentPreviewsProps) {
  const [page, setPage] = useState(0);
  const [loadedTournaments, setLoadedTournaments] = useState<Database['public']['Tables']['tournaments']['Row'][]>([]);
  const { data: tournamentPage, isLoading: tournamentsLoading } = useTournaments(props.user?.id, {
    page,
    pageSize: TOURNAMENT_PAGE_SIZE,
  });

  useEffect(() => {
    setPage(0);
    setLoadedTournaments([]);
  }, [props.user?.id]);

  useEffect(() => {
    if (!tournamentPage) return;

    setLoadedTournaments((prev) => {
      if (page === 0) return tournamentPage;

      const seen = new Set(prev.map((tournament) => tournament.id));
      const next = [...prev];
      for (const tournament of tournamentPage) {
        if (!seen.has(tournament.id)) {
          next.push(tournament);
        }
      }

      return next;
    });
  }, [page, tournamentPage]);

  const tournaments = loadedTournaments;
  const tournamentIds = useMemo(
    () => tournaments.map((tournament) => tournament.id),
    [tournaments]
  );
  const { data: rounds } = useTournamentRounds(props.user?.id, {
    tournamentIds,
    previewOnly: true,
  });
  const basePath = props.basePath ?? '/tournaments';
  const hasMoreTournaments = (tournamentPage?.length ?? 0) === TOURNAMENT_PAGE_SIZE;

  const [isInteractionBlocked, ] = useState(false);
  const [selectedCats, setSelectedCats] = useState<TournamentCategoryTab[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<TournamentFormatsTab>('All');

  const roundsByTournament = useMemo(() => {
    return (rounds ?? []).reduce((acc, round) => {
      const current = acc.get(round.tournament) ?? [];
      current.push(round);
      acc.set(round.tournament, current);
      return acc;
    }, new Map<string, { result: string[] }[]>());
  }, [rounds]);

  const availableTournamentCategories = useMemo(() =>
    allTournamentCategoryTabs.filter((cat) => cat !== 'all')
      .map((cat) => ({
        value: cat,
        label: `${displayTournamentCategoryTab(cat)} (${
          tournaments.filter((t) => t.category === cat && (t.format === selectedFormat || selectedFormat === 'All')).length
        })`,
        icon: <TournamentCategoryIcon category={cat as TournamentCategory} />
      })),
    [allTournamentCategoryTabs, tournaments, selectedFormat]
  );

  const availableFormats: TournamentFormatsTab[] = ['All'];
  tournaments.forEach((tournament) => {
    if (tournament.format && !availableFormats.includes(tournament.format as TournamentFormatsTab)) {
      availableFormats.push(tournament.format as TournamentFormatsTab);
    }
  });

  const filteredTournaments = tournaments.filter((tournament) =>
    (selectedCats.length === 0 || selectedCats.includes(tournament.category as TournamentCategoryTab))
    && (selectedFormat === 'All' || tournament.format === selectedFormat)
  );

  if (!tournamentsLoading && tournaments.length === 0) {
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
                  {tournaments.filter((tournament) => format === 'All' ? true : tournament.format === format).length}
                  )
                </p>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      </div>

      <div className={isInteractionBlocked ? 'pointer-events-none' : ''}>
        {filteredTournaments.length === 0 && (
          <Card className="border-none">
            <CardHeader className="px-2">
              <CardDescription>No tournaments found for the selected category and format.</CardDescription>
            </CardHeader>
          </Card>
        )}

        {selectedCats.length === 0 ? (
          <div className="flex flex-col gap-2">
            {filteredTournaments.map((tournament) =>
              (
                <TournamentPreview
                  key={tournament.id}
                  tournament={tournament}
                  rounds={roundsByTournament.get(tournament.id) ?? []}
                  basePath={basePath}
                  hatType={tournament.hat_type}
                />
              )
            )}
          </div>
        ) : (
          <ScrollArea className="h-[36rem]">
            <div className="flex flex-col gap-2">
              {filteredTournaments.map((tournament) =>
                (
                  <TournamentPreview
                  key={tournament.id}
                  tournament={tournament}
                  rounds={roundsByTournament.get(tournament.id) ?? []}
                  shouldHideCategoryBadge
                  basePath={basePath}
                  hatType={tournament.hat_type}
                  />
                )
              )}
            </div>
          </ScrollArea>
        )}

        {hasMoreTournaments && (
          <div className="mt-4 flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={tournamentsLoading}
            >
              {tournamentsLoading
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <T id="tournaments.loadMore">Load more tournaments</T>}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
