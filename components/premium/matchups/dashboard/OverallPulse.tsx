'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { filteredRowsSelector } from "../recoil-matchups/deckMatchupSelector";
import { useRecoilValue } from "recoil";
import { formatWinRate, groupBySourceOrFormat, tallyRows } from "./dashboard.utils";

const pillClass =
  "inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700";

const formatRecord = (wins: number, losses: number, ties: number) =>
  ties ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;

export const OverallPulse = () => {
  const rows = useRecoilValue(filteredRowsSelector);

  if (!rows) return null;
  if (rows.length === 0)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Overall Pulse</CardTitle>
          <CardDescription>No data matches these filters yet.</CardDescription>
        </CardHeader>
      </Card>
    );

  const overall = tallyRows(rows);
  const sourceBreakdown = groupBySourceOrFormat(rows, "source");

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Overall Pulse</CardTitle>
          <span className={pillClass}>{rows.length} matches</span>
        </div>
        <CardDescription>Top-level health of your games.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <p className="text-sm text-muted-foreground">Win rate</p>
          <p className="text-3xl font-semibold">{formatWinRate(overall.winRate)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Record {formatRecord(overall.wins, overall.losses, overall.ties)}
          </p>
        </div>
        <div className="sm:col-span-2 sm:col-start-3">
          <p className="text-sm text-muted-foreground">By source</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(sourceBreakdown).map(([source, stats]) => (
              <span key={source} className={pillClass}>
                {source}: {formatWinRate(stats.winRate)} ({formatRecord(stats.wins, stats.losses, stats.ties)})
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
