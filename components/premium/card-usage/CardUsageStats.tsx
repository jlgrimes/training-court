"use client";

import { useMemo, useState } from "react";
import { T, useGT } from "gt-react";

import { DecklistSelect } from "@/components/ptcg/deckbuilder/DecklistSelect";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { logFormats } from "@/components/tournaments/Format/tournament-format.types";
import { useCardUsageLogs } from "@/hooks/card-usage/useCardUsageLogs";
import { cn } from "@/lib/utils";
import { buildCardUsageStats } from "./CardUsage.utils";

type CardUsageStatsProps = {
  userId: string;
  currentUserScreenName: string | null;
};

const ALL_VALUE = "all";

const formatPercent = (value: number | null) => {
  if (value === null) return "-";
  return `${(value * 100).toFixed(1)}%`;
};

const formatDelta = (value: number | null) => {
  if (value === null) return "-";
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(1)}%`;
};

export const CardUsageStats = (props: CardUsageStatsProps) => {
  const gt = useGT();
  const { data: rows = [], isLoading } = useCardUsageLogs(props.userId);
  const [decklistId, setDecklistId] = useState<string | null>(null);
  const [opponentArchetype, setOpponentArchetype] = useState(ALL_VALUE);
  const [format, setFormat] = useState(ALL_VALUE);
  const [turnOrder, setTurnOrder] = useState(ALL_VALUE);
  const [minimumGames, setMinimumGames] = useState(3);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (decklistId && row.decklist_id !== decklistId) return false;
      if (opponentArchetype !== ALL_VALUE && row.opp_archetype !== opponentArchetype) return false;
      if (format !== ALL_VALUE && row.format !== format) return false;
      if (turnOrder !== ALL_VALUE && row.turn_order !== turnOrder) return false;
      return row.result === "W" || row.result === "L" || row.result === "T";
    });
  }, [decklistId, format, opponentArchetype, rows, turnOrder]);

  const opponentOptions = useMemo(() => {
    const filteredForDecklist = decklistId
      ? rows.filter((row) => row.decklist_id === decklistId)
      : rows;

    return Array.from(
      new Set(
        filteredForDecklist
          .map((row) => row.opp_archetype)
          .filter((deck): deck is string => Boolean(deck))
      )
    ).sort((left, right) => left.localeCompare(right));
  }, [decklistId, rows]);

  const stats = useMemo(() => {
    if (!props.currentUserScreenName) return [];

    return buildCardUsageStats(filteredRows, props.currentUserScreenName).filter(
      (stat) => stat.gamesPlayed >= minimumGames
    );
  }, [filteredRows, minimumGames, props.currentUserScreenName]);

  if (!props.currentUserScreenName) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <T id="cardUsage.missingScreenName.title">Card usage needs your PTCG Live screen name</T>
          </CardTitle>
          <CardDescription>
            <T id="cardUsage.missingScreenName.description">
              Add your screen name in preferences before viewing card usage stats.
            </T>
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-wide">
          <T id="cardUsage.title">Card Usage</T>
        </h1>
        <p className="text-sm text-muted-foreground">
          <T id="cardUsage.description">
            See how often cards appear in your battle logs and how those games performed.
          </T>
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <DecklistSelect
          userId={props.userId}
          value={decklistId}
          noneLabel={gt("All decklists", { $id: "cardUsage.filters.allDecklists" })}
          ariaLabel={gt("Decklist", { $id: "cardUsage.filters.decklist" })}
          onChange={(decklist) => {
            setDecklistId(decklist?.id ?? null);
            setOpponentArchetype(ALL_VALUE);
          }}
        />

        <Select value={opponentArchetype} onValueChange={setOpponentArchetype}>
          <SelectTrigger aria-label={gt("Opponent archetype", { $id: "cardUsage.filters.opponent" })}>
            <SelectValue placeholder={gt("Opponent archetype", { $id: "cardUsage.filters.opponent" })} />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value={ALL_VALUE}>
              <T id="cardUsage.filters.allOpponents">All opponents</T>
            </SelectItem>
            {opponentOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={format} onValueChange={setFormat}>
          <SelectTrigger aria-label={gt("Format", { $id: "cardUsage.filters.format" })}>
            <SelectValue placeholder={gt("Format", { $id: "cardUsage.filters.format" })} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>
              <T id="cardUsage.filters.allFormats">All formats</T>
            </SelectItem>
            {logFormats.map((formatOption) => (
              <SelectItem key={formatOption} value={formatOption}>
                {formatOption}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={turnOrder} onValueChange={setTurnOrder}>
          <SelectTrigger aria-label={gt("Turn order", { $id: "cardUsage.filters.turnOrder" })}>
            <SelectValue placeholder={gt("Turn order", { $id: "cardUsage.filters.turnOrder" })} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>
              <T id="cardUsage.filters.allTurnOrders">First or second</T>
            </SelectItem>
            <SelectItem value="1">
              <T id="cardUsage.filters.goingFirst">Going first</T>
            </SelectItem>
            <SelectItem value="2">
              <T id="cardUsage.filters.goingSecond">Going second</T>
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={String(minimumGames)} onValueChange={(value) => setMinimumGames(Number(value))}>
          <SelectTrigger aria-label={gt("Minimum games", { $id: "cardUsage.filters.minimumGames" })}>
            <SelectValue placeholder={gt("Minimum games", { $id: "cardUsage.filters.minimumGames" })} />
          </SelectTrigger>
          <SelectContent>
            {[1, 3, 5, 10].map((value) => (
              <SelectItem key={value} value={String(value)}>
                {value}+ <T id="cardUsage.filters.games">games</T>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-[47px] w-full rounded-xl" />
          <Skeleton className="h-[47px] w-full rounded-xl" />
          <Skeleton className="h-[47px] w-full rounded-xl" />
        </div>
      )}

      {!isLoading && filteredRows.length === 0 && (
        <p className="text-sm text-muted-foreground">
          <T id="cardUsage.empty.noLogs">No battle logs match these filters.</T>
        </p>
      )}

      {!isLoading && filteredRows.length > 0 && stats.length === 0 && (
        <p className="text-sm text-muted-foreground">
          <T id="cardUsage.empty.noCards">No cards meet the minimum games filter.</T>
        </p>
      )}

      {!isLoading && stats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              <T id="cardUsage.table.title">Usage by card</T>
            </CardTitle>
            <CardDescription>
              {filteredRows.length} <T id="cardUsage.table.filteredGames">filtered games</T>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <T id="cardUsage.table.card">Card</T>
                  </TableHead>
                  <TableHead className="text-right">
                    <T id="cardUsage.table.usage">Usage</T>
                  </TableHead>
                  <TableHead className="text-right">
                    <T id="cardUsage.table.whenPlayed">When played</T>
                  </TableHead>
                  <TableHead className="text-right">
                    <T id="cardUsage.table.notPlayed">Not played</T>
                  </TableHead>
                  <TableHead className="text-right">
                    <T id="cardUsage.table.delta">Delta</T>
                  </TableHead>
                  <TableHead className="text-right">
                    <T id="cardUsage.table.avgTurn">Avg turn</T>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((stat) => (
                  <TableRow key={stat.cardName}>
                    <TableCell className="font-medium">{stat.cardName}</TableCell>
                    <TableCell className="text-right">
                      {formatPercent(stat.usageRate)}
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({stat.gamesPlayed}/{stat.totalGames})
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercent(stat.winRateWhenPlayed)}
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({stat.winsWhenPlayed}-{stat.lossesWhenPlayed}
                        {stat.tiesWhenPlayed > 0 ? `-${stat.tiesWhenPlayed}` : ""})
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{formatPercent(stat.winRateWhenNotPlayed)}</TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-medium",
                        stat.deltaWinRate !== null && stat.deltaWinRate > 0 && "text-emerald-600",
                        stat.deltaWinRate !== null && stat.deltaWinRate < 0 && "text-red-600"
                      )}
                    >
                      {formatDelta(stat.deltaWinRate)}
                    </TableCell>
                    <TableCell className="text-right">
                      {stat.averageFirstTurnPlayed === null ? "-" : stat.averageFirstTurnPlayed.toFixed(1)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
