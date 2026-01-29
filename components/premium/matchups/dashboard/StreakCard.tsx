'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { filteredRowsSelector } from "../recoil-matchups/deckMatchupSelector";
import { useRecoilValue } from "recoil";
import { getCurrentStreak } from "./dashboard.utils";

export const StreakCard = () => {
  const rows = useRecoilValue(filteredRowsSelector);

  if (!rows) return null;

  const streak = getCurrentStreak(rows);

  const descriptor = streak.type
    ? streak.type === "W"
      ? "Hot streak"
      : streak.type === "L"
        ? "Cold streak"
        : "Tie run"
    : "No streak yet";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Current Streak</CardTitle>
          <CardDescription>Most recent run</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No games yet for this filter.</p>
        ) : (
          <>
            <p className="text-3xl font-semibold">
              {streak.length} {streak.type ?? "-"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{descriptor}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
};
