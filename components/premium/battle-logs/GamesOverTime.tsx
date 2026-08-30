"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Database } from "@/database.types"
import { format, isWithinInterval, subWeeks } from "date-fns"
import { useMemo } from "react"
import { PremiumIcon } from "../PremiumIcon"
import { convertBattleLogPreviewDateIntoDay } from "@/components/battle-logs/utils/battle-log-preview.utils"

export const description = "A stacked area chart"

const chartConfig = {
  wins: {
    label: "Wins",
    color: "hsl(var(--chart-2))",
  },
  losses: {
    label: "Losses",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

interface GamesOverTimeProps {
  logs: Database['public']['Tables']['logs']['Row'][];
  currentUserScreenName: string | null;
}

export function GamesOverTime(props: GamesOverTimeProps) {
  const data = useMemo(() => {
    const now = new Date();
    const logsByDay = props.logs
      .filter((log) => isWithinInterval(log.created_at, { start: subWeeks(now, 1), end: now }))
      .reduce((acc: Record<string, { date: string; wins: number; losses: number }>, log) => {
        const day = convertBattleLogPreviewDateIntoDay(log.created_at);
        const current = acc[day] ?? { date: log.created_at, wins: 0, losses: 0 };
        return {
          ...acc,
          [day]: {
            ...current,
            wins: current.wins + (log.result === 'W' ? 1 : 0),
            losses: current.losses + (log.result === 'L' ? 1 : 0),
          },
        };
      }, {});

    return Object.values(logsByDay).reverse();
  }, [props.logs]);

  const winRate = useMemo(() => {
    const totalLosses = data.reduce((acc, curr) => acc + curr.losses , 0);
    const totalWins = data.reduce((acc, curr) => acc + curr.wins , 0);

    return totalWins / (totalLosses + totalWins);
  }, [data])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">{`Games played in the last week`}<PremiumIcon /></CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 && (
          <CardHeader className="px-2">
            <CardDescription>No battles recorded in the past week</CardDescription>
            <CardDescription>Get out there and play some games!</CardDescription>
          </CardHeader>
        )}
        {data.length > 0 && (
          <ChartContainer config={chartConfig}>
            <BarChart
              accessibilityLayer
              data={data}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => format(value, 'M/d')}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" labelFormatter={(value) => format(value, "LLL d")} />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="wins"
                type="natural"
                fill="hsl(var(--chart-2))"
                stroke="hsl(var(--chart-2))"
                radius={[0, 0, 4, 4]}
                stackId="a"
              />
              <Bar
                dataKey="losses"
                type="natural"
                fill="hsl(var(--chart-1))"
                radius={[4, 4, 0, 0]}
                stroke="hsl(var(--chart-1))"
                stackId="a"
              />
            </BarChart>
        </ChartContainer>
        )}
      </CardContent>
      {data.length > 0 && (
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              You have a {(winRate * 100).toFixed(2)}% win rate <TrendingUp className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              {format(data[0].date, 'LLL d')} - {format(data[data.length - 1].date, 'LLL d')}
            </div>
          </div>
        </div>
      </CardFooter>
      )}
    </Card>
  )
}
