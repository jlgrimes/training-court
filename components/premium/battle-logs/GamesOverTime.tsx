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
import { parseBattleLog } from "@/components/battle-logs/utils/battle-log.utils"
import { getBattleLogsByDayList, groupBattleLogIntoDays } from "@/components/battle-logs/BattleLogGroups/battle-log-groups.utils"
import { BattleLog } from "@/components/battle-logs/utils/battle-log.types"
import { format, interval, isThisWeek, isWithinInterval, subWeeks } from "date-fns"
import { useMemo } from "react"
import { PremiumIcon } from "../PremiumIcon"

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
  const parsedBattleLogs = props.logs.map((log) => parseBattleLog(log.log, log.id, log.created_at || new Date().toISOString(), log.archetype, log.opp_archetype, props.currentUserScreenName));
  const battleLogsByDayList = getBattleLogsByDayList(groupBattleLogIntoDays(parsedBattleLogs));
  const logsByDay = battleLogsByDayList.reverse().filter(([_, logs]) => isWithinInterval(logs[0].date, { start: subWeeks(new Date(), 1), end: new Date() }));
  const data = logsByDay.map(([date, battleLogs]) => {
    const { wins, losses } = battleLogs.reduce((acc: { wins: number, losses: number }, curr: BattleLog) => {
      if (curr.winner === props.currentUserScreenName) {
        return {
          wins: acc.wins + 1,
          losses: acc.losses
        }
      } else {
        return {
          wins: acc.wins,
          losses: acc.losses + 1
        }
      }
    }, { wins: 0, losses: 0 });

    return {
      date: battleLogs[0].date,
      wins,
      losses
    }
  });

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
