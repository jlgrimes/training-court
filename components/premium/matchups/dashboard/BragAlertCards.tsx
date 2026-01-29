'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { filteredRowsSelector } from "../recoil-matchups/deckMatchupSelector";
import { useRecoilValue } from "recoil";
import {
  byOpponentDeck,
  deckTurnOrderSplits,
  freebiesBreakdown,
  formatWinRate,
  getCurrentStreak,
} from "./dashboard.utils";

const Tile = ({ title, value, sub }: { title: string; value: string; sub?: string }) => (
  <div className="rounded-lg border p-3">
    <p className="text-xs text-muted-foreground">{title}</p>
    <p className="text-lg font-semibold">{value}</p>
    {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
  </div>
);

export const BragAlertCards = () => {
  const rows = useRecoilValue(filteredRowsSelector);

  if (!rows) return null;
  if (rows.length === 0)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Brag / Alert</CardTitle>
          <CardDescription>No data matches these filters yet.</CardDescription>
        </CardHeader>
      </Card>
    );

  const oppMap = byOpponentDeck(rows);
  const minSample = 5;

  const best = Object.entries(oppMap)
    .filter(([, v]) => v.counts.total >= minSample)
    .sort((a, b) => b[1].counts.winRate - a[1].counts.winRate)[0];

  const worst = Object.entries(oppMap)
    .filter(([, v]) => v.counts.total >= minSample)
    .sort((a, b) => a[1].counts.winRate - b[1].counts.winRate)[0];

  const freebies = freebiesBreakdown(rows);
  const freebiesTotal = Object.values(freebies).reduce((acc, cur) => acc + cur, 0);

  const streak = getCurrentStreak(rows);

  const turnSplit = deckTurnOrderSplits(rows);
  const swing = Object.entries(turnSplit)
    .map(([deck, splits]) => ({
      deck,
      delta: splits.first.winRate - splits.second.winRate,
      total: splits.total,
    }))
    .filter((d) => d.total >= minSample)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Brag / Alert</CardTitle>
          <CardDescription>Callouts worth sharing</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          title="Best matchup"
          value={
            best
              ? `${best[0]} · ${formatWinRate(best[1].counts.winRate)}`
              : "Need more data"
          }
          sub={best ? `${best[1].counts.wins}-${best[1].counts.losses}-${best[1].counts.ties}` : undefined}
        />
        <Tile
          title="Problem matchup"
          value={
            worst
              ? `${worst[0]} · ${formatWinRate(worst[1].counts.winRate)}`
              : "Need more data"
          }
          sub={
            worst ? `${worst[1].counts.wins}-${worst[1].counts.losses}-${worst[1].counts.ties}` : undefined
          }
        />
        <Tile
          title="Current streak"
          value={streak.type ? `${streak.length} ${streak.type}` : "—"}
          sub={streak.type ? (streak.type === "W" ? "Hot streak" : streak.type === "L" ? "Cold streak" : "Tie run") : "Play more games"}
        />
        <Tile
          title="Freebies"
          value={freebiesTotal ? `${freebiesTotal} auto-results` : "None"}
          sub={
            freebiesTotal
              ? Object.entries(freebies)
                  .map(([reason, count]) => `${reason}: ${count}`)
                  .join(" · ")
              : "No IDs / No shows / Byes"
          }
        />
        <Tile
          title="Turn order swing"
          value={
            swing
              ? `${swing.deck} · ${swing.delta > 0 ? "+" : ""}${Math.round(swing.delta * 100)}%`
              : "Need more data"
          }
          sub={swing ? `${swing.total} tracked games` : undefined}
        />
      </CardContent>
    </Card>
  );
};
