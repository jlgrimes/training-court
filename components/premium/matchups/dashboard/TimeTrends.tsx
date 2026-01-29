'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { filteredRowsSelector } from "../recoil-matchups/deckMatchupSelector";
import { useRecoilValue } from "recoil";
import { formatWinRate, weeklyTrend } from "./dashboard.utils";
import { format, parseISO } from "date-fns";

export const TimeTrends = () => {
  const rows = useRecoilValue(filteredRowsSelector);

  if (!rows) return null;
  const trend = weeklyTrend(rows);
  const makePath = () => {
    if (trend.length === 0) return "";
    const points = trend.map((p, idx) => {
      const x = trend.length === 1 ? 0 : (idx / (trend.length - 1)) * 100;
      const y = (1 - Math.max(0, Math.min(1, p.winRate))) * 100;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });
    return `M ${points.join(" L ")}`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Time Trends</CardTitle>
          <CardDescription>Rolling weekly performance</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {trend.length === 0 ? (
          <div className="text-sm text-muted-foreground">No games yet for this time window.</div>
        ) : (
          <div className="space-y-3">
            <div className="relative w-full h-32 bg-slate-50 rounded-lg border overflow-hidden">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full pointer-events-none">
                <path
                  d={makePath()}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {trend.map((p, idx) => {
                  const x = trend.length === 1 ? 0 : (idx / (trend.length - 1)) * 100;
                  const y = (1 - Math.max(0, Math.min(1, p.winRate))) * 100;
                  return (
                    <circle
                      key={p.label}
                      cx={x}
                      cy={y}
                      r={1.5}
                      fill="hsl(var(--primary))"
                      stroke="white"
                      strokeWidth="0.5"
                    />
                  );
                })}
              </svg>
              <div className="absolute bottom-2 left-3 right-3 flex justify-between text-[10px] text-muted-foreground">
                <span>{format(parseISO(trend[0].label), "MMM d")}</span>
                <span>{format(parseISO(trend[trend.length - 1].label), "MMM d")}</span>
              </div>
            </div>
            <div className="space-y-1">
              {trend.slice(-4).map((week) => (
                <div key={week.label} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{format(parseISO(week.label), "MMM d")}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatWinRate(week.winRate)} · {week.total} games
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
