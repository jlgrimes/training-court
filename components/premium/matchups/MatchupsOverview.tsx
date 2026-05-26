'use client';

import { useEffect } from "react";
import { MatchupProps } from "./Matchups.types";
import { DeckMatchupsDetail } from "./DeckMatchupsDetail";
import { MatchupsTable } from "./MatchupsTable";
import { useMatchups } from "@/hooks/matchups/useMatchups";
import { Skeleton } from "@/components/ui/skeleton";
import { flattenMatchupsToDeckSummary } from "./Matchups.utils";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { tournamentFormats } from "@/components/tournaments/Format/tournament-format.types";
import { DecklistSelect } from "@/components/ptcg/deckbuilder/DecklistSelect";
import { decklistFilterAtom, detailDeckAtom, formatFilterAtom, rawMatchupsAtom, sourceFilterAtom, turnOrderFilterAtom } from "./recoil-matchups/deckMatchupAtom";
import { transformedMatchupsSelector } from "./recoil-matchups/deckMatchupSelector";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { useUiTranslations } from "@/hooks/useUiTranslations";

export const MatchupsOverview = (props: MatchupProps) => {
  const { data, isLoading } = useMatchups(props.userId);
  const { t } = useUiTranslations();

  const setRaw = useSetRecoilState(rawMatchupsAtom);
  useEffect(() => {
    setRaw(data ?? null);
  }, [data, setRaw]);

  const [sourceFilter, setSourceFilter] = useRecoilState(sourceFilterAtom);
  const [formatFilter, setFormatFilter] = useRecoilState(formatFilterAtom);
  const [turnOrderFilter, setTurnOrderFilter] = useRecoilState(turnOrderFilterAtom);
  const [decklistFilter, setDecklistFilter] = useRecoilState(decklistFilterAtom);
  const detailDeck = useRecoilValue(detailDeckAtom);
  const setDetailDeck = useSetRecoilState(detailDeckAtom);
  const transformed = useRecoilValue(transformedMatchupsSelector);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl tracking-wide font-semibold">{t('matchups.title')}</h1>
          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">

        <ToggleGroup
          type="multiple"
          variant="outline"
          value={sourceFilter}
          onValueChange={(val) => setSourceFilter(val)}
          >
            <ToggleGroup
          type="multiple"
          value={turnOrderFilter}
          onValueChange={setTurnOrderFilter}
          variant="outline"
        >
          <ToggleGroupItem 
            value="1" 
            aria-label={t('tournament.first')}
            className="
            font-medium rounded-lg
            border border-transparent
            data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:border-primary
            transition-colors
            hover:bg-transparent hover:no-underline
            h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm
          ">
            {t('tournament.first')}
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="2" 
            aria-label={t('tournament.second')}
            className="
            font-medium rounded-lg
            border border-transparent
            data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:border-primary
            transition-colors
            hover:bg-transparent hover:no-underline
            h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm
          ">
            {t('tournament.second')}
          </ToggleGroupItem>
        </ToggleGroup>

          {/* <ToggleGroupItem value="all" aria-label="All Sources">All</ToggleGroupItem> */}
          <ToggleGroupItem
            value="Battle Logs"
            aria-label={t('matchups.logs')}
            className="
            font-medium rounded-lg
            border border-transparent
            data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:border-primary
            transition-colors
            // This resolves a hover issue on mobile where unclicking a button still gives hover color
            hover:bg-transparent hover:no-underline
            h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm
          ">
            {t('matchups.logs')}
          </ToggleGroupItem>

          <ToggleGroupItem 
            value="Tournament Rounds" 
            aria-label={t('matchups.tournaments')} 
            className="
            font-medium rounded-lg
            border border-transparent
            data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:border-primary
            transition-colors
            hover:bg-transparent hover:no-underline
            h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm
          ">
            {t('matchups.tournaments')}
          </ToggleGroupItem>

          <Select value={formatFilter ?? 'All'} onValueChange={(val) => setFormatFilter(val)}>
            <SelectTrigger className="w-[120px] sm:w-[180px]">
              <SelectValue placeholder={t('matchups.all_formats')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={"All"}>{t('matchups.all_formats')}</SelectItem>
              {tournamentFormats.map((format) => (
                <SelectItem key={format} value={format}>
                  {format}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ToggleGroup>

          {props.userId && (
            <div className="w-[180px] sm:w-[220px]">
              <DecklistSelect
                userId={props.userId}
                value={decklistFilter}
                noneLabel="All matchups"
                onChange={(decklist) => {
                  setDecklistFilter(decklist?.id ?? null);
                  setDetailDeck('');
                }}
              />
            </div>
          )}
         
      </div>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="w-full h-[47px] rounded-xl" />
          <Skeleton className="w-full h-[47px] rounded-xl" />
          <Skeleton className="w-full h-[47px] rounded-xl" />
          <Skeleton className="w-full h-[47px] rounded-xl" />
          <Skeleton className="w-full h-[47px] rounded-xl" />
        </div>
      )}

      {transformed && Object.keys(transformed).length === 0 && !isLoading && (
        <p className="text-sm text-muted-foreground">{t('matchups.no_data')}</p>
      )}

      {transformed && Object.keys(transformed).length > 0 && (
        detailDeck ? (
          <DeckMatchupsDetail
            deckName={detailDeck}
            deckMatchup={transformed[detailDeck]}
            handleExitDetailView={() => {setDetailDeck('')}}
          />
        ) : (
          <MatchupsTable 
            matchups={flattenMatchupsToDeckSummary(transformed)}
            onRowClick={(deck) => setDetailDeck(deck)}
          />
        )
      )}
    </div>
  );
};
