'use client';

import PocketTournamentPreview from "./PocketTournamentPreview";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TournamentCategory, TournamentCategoryTab, allTournamentCategoryTabs, displayTournamentCategoryTab } from "@/components/tournaments/Category/tournament-category.types";
import { TournamentCategoryIcon } from "@/components/tournaments/Category/TournamentCategoryIcon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo, useState } from "react";
import { TournamentFormatsTab } from "@/components/tournaments/Format/tournament-format.types";
import MultiSelect from "@/components/ui/multi-select";
import { usePocketTournaments } from "@/hooks/pocket/tournaments/usePocketTournaments";
import { usePocketTournamentRounds } from "@/hooks/pocket/tournaments/usePocketTournamentRounds";
import type { PocketTournament, PocketTournamentRound } from "@/lib/server/home-data";
import { Button } from "@/components/ui/button";
import { T } from "gt-react";

const TOURNAMENT_PAGE_SIZE = 25;

interface MyPocketTournamentPreviewsProps {
  userId?: string;
  showFilters?: boolean;
  limit?: number;
  /** Optional pre-fetched tournaments - if provided, skips SWR fetch */
  initialTournaments?: PocketTournament[];
  /** Optional pre-fetched rounds - if provided, skips SWR fetch */
  initialRounds?: PocketTournamentRound[];
}

export function MyPocketTournamentPreviews(props: MyPocketTournamentPreviewsProps) {
  const { initialTournaments, initialRounds } = props;
  const initialLimit = props.limit ?? TOURNAMENT_PAGE_SIZE;
  const [visibleLimit, setVisibleLimit] = useState(initialLimit);

  // Only fetch via SWR if no initial data provided
  const { data: swrTournamentPage } = usePocketTournaments(
    initialTournaments ? undefined : props.userId,
    props.limit ?? visibleLimit + 1
  );

  const tournamentPage = initialTournaments ?? swrTournamentPage;
  const hasMore = !props.limit && (tournamentPage?.length ?? 0) > visibleLimit;
  const tournaments = props.limit
    ? tournamentPage?.slice(0, props.limit)
    : tournamentPage?.slice(0, visibleLimit);
  const tournamentIds = (tournaments ?? []).map((tournament) => tournament.id);
  const { data: swrRounds } = usePocketTournamentRounds(
    initialRounds ? undefined : props.userId,
    tournamentIds
  );
  const rounds = initialRounds ?? swrRounds;

  const [isInteractionBlocked, ] = useState(false);
  const [selectedCats, setSelectedCats] = useState<TournamentCategoryTab[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<TournamentFormatsTab>('All');

  const availableTournamentCategories = useMemo(() =>
    allTournamentCategoryTabs.filter((cat) => cat !== 'all')
      .map((cat) => ({
        value: cat,
        label: `${displayTournamentCategoryTab(cat)} (${
          tournaments?.filter((t) => t.category === cat && (t.format === selectedFormat || selectedFormat === 'All')).length ?? 0
        })`,
        icon: <TournamentCategoryIcon category={cat as TournamentCategory} />
      })),
    [tournaments, selectedFormat]
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
      {props.showFilters !== false && (
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
                      {tournaments?.filter((tournament) => format === 'All' ? true : tournament.format === format).length}
                      )
                    </p>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

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
                <PocketTournamentPreview
                  key={tournament.id}
                  tournament={tournament}
                  rounds={rounds.filter((round) => round.tournament === tournament.id)}
                  hatType={tournament.hat_type}
                />
              ) : null
            )}
          </div>
        ) : (
            <ScrollArea className="h-[36rem]">
              <div className="flex flex-col gap-2">
              {filteredTournaments?.map((tournament) =>
                rounds ? (
                  <PocketTournamentPreview
                  key={tournament.id}
                  tournament={tournament}
                  rounds={rounds.filter((round) => round.tournament === tournament.id)}
                  hatType={tournament.hat_type}
                  />
                ) : null
              )}
            </div>
          </ScrollArea>
        )}
      </div>
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setVisibleLimit((current) => current + TOURNAMENT_PAGE_SIZE)}
          >
            <T id="common.loadMore">Load more</T>
          </Button>
        </div>
      )}
    </div>
  );
}
