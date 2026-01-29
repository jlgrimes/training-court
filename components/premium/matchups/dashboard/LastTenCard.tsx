'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { filteredRowsSelector } from "../recoil-matchups/deckMatchupSelector";
import { useRecoilValue } from "recoil";
import { formatWinRate, lastNStats } from "./dashboard.utils";

const formatRecord = (wins: number, losses: number, ties: number) =>
  ties ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;

export const LastTenCard = () => {
  const rows = useRecoilValue(filteredRowsSelector);

  if (!rows) return null;

  const lastCount = Math.min(rows.length, 10);
  const lastSlice = lastNStats(rows, lastCount);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Last {lastCount}</CardTitle>
          <CardDescription>Most recent games</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No games yet for this filter.</p>
        ) : (
          <div>
            <p className="text-3xl font-semibold">{formatWinRate(lastSlice.winRate)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Record {formatRecord(lastSlice.wins, lastSlice.losses, lastSlice.ties)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
