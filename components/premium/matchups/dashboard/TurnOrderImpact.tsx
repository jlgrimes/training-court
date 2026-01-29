'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { filteredRowsSelector } from "../recoil-matchups/deckMatchupSelector";
import { useRecoilValue } from "recoil";
import { deckTurnOrderSplits, formatWinRate, turnOrderSplits } from "./dashboard.utils";

const rowClass = "flex items-center justify-between text-sm py-1 border-b last:border-b-0 border-border/50";
const formatDelta = (delta: number) => `${delta > 0 ? "+" : ""}${Math.round(delta * 100)}%`;

export const TurnOrderImpact = () => {
  const rows = useRecoilValue(filteredRowsSelector);

  if (!rows) return null;
  if (rows.length === 0)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Turn Order Impact</CardTitle>
          <CardDescription>No data matches these filters yet.</CardDescription>
        </CardHeader>
      </Card>
    );

  const overall = turnOrderSplits(rows);
  const decks = deckTurnOrderSplits(rows);

  const rankedDecks = Object.entries(decks)
    .map(([deck, splits]) => ({
      deck,
      delta: splits.first.winRate - splits.second.winRate,
      first: splits.first,
      second: splits.second,
      total: splits.total,
    }))
    .filter((d) => d.first.total + d.second.total >= 5)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Turn Order Impact</CardTitle>
          <CardDescription>How much first vs second matters.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Going first</p>
            <p className="text-2xl font-semibold">{formatWinRate(overall.first.winRate)}</p>
            <p className="text-xs text-muted-foreground">{overall.first.total} games</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Going second</p>
            <p className="text-2xl font-semibold">{formatWinRate(overall.second.winRate)}</p>
            <p className="text-xs text-muted-foreground">{overall.second.total} games</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Delta</p>
            <p className="text-2xl font-semibold">{formatDelta(overall.first.winRate - overall.second.winRate)}</p>
            <p className="text-xs text-muted-foreground">
              {overall.first.winRate >= overall.second.winRate ? "Better going first" : "Better going second"}
            </p>
          </div>
        </div>

        <div className="rounded-lg border">
          <div className="px-4 py-2 border-b text-xs uppercase tracking-wide text-muted-foreground">
            Biggest turn-order swings by deck
          </div>
          {rankedDecks.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground">Not enough games per deck yet.</div>
          )}
          {rankedDecks.map((deck) => (
            <div key={deck.deck} className={rowClass}>
              <div className="px-4 flex-1">
                <p className="font-semibold">{deck.deck}</p>
                <p className="text-xs text-muted-foreground">{deck.total} games</p>
              </div>
              <div className="px-4 text-right">
                <p className="text-sm">
                  1st {formatWinRate(deck.first.winRate)} / 2nd {formatWinRate(deck.second.winRate)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Δ {formatDelta(deck.delta)} ({deck.delta > 0 ? "prefers 1st" : deck.delta < 0 ? "prefers 2nd" : "neutral"})
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
