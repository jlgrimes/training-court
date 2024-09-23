"use client"
import { TrendingUp } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
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
import { Database } from "@/database.types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMemo } from "react"
import { Sprite } from "@/components/archetype/Sprite"

interface YourMatchupsProps {
  matchupData: Database['public']['Functions']['getusertournamentresults']['Returns'] | null;
}

const chartConfig = {
  win_rate: {
    label: "Win rate",
    color: "hsl(var(--chart-1))",
  },
  tie_rate: {
    label: "Tie rate",
    color: "hsl(var(--chart-2))",
  },
  loss_rate: {
    label: "Loss rate",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export const YourMatchups = (props: YourMatchupsProps) => {
  const yourDecks = useMemo(() => {
    return Array.from(new Set(props.matchupData?.map(({ tournament_deck }) => tournament_deck)));
  }, [props.matchupData]);

  if (!props.matchupData) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your matchups</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={yourDecks[0]}>
          <TabsList>
            {yourDecks.map((deck) => (
              <TabsTrigger value={deck}><Sprite name={deck} /></TabsTrigger>
            ))}
          </TabsList>
          {yourDecks.map((deck) => {
            const matchups = props.matchupData!.filter(({ tournament_deck }) => tournament_deck === deck).slice(0, 10);
            const chartData = matchups.map(({ round_deck, win_rate, tie_rate, total_wins, total_losses, total_ties }) => ({
              round_deck,
              win_rate,
              tie_rate,
              loss_rate: 100 - win_rate - tie_rate,
              total_wins,
              total_losses,
              total_ties
            }))

            return (
              <TabsContent value={deck}>
                <ChartContainer config={chartConfig}>
              <BarChart
                accessibilityLayer
                data={chartData}
                layout="vertical"
                margin={{
                  left: -20,
                }}
              >
                <XAxis type="number" dataKey="win_rate" hide />
                <YAxis
                  dataKey="round_deck"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 4)}
                />
                <ChartTooltip
                  cursor={false}
                  labelFormatter={(label) => {
                    const dataIntoDeck = chartData.find(({ round_deck }) => round_deck === label);
                    if (!dataIntoDeck) return label;

                    return (
                      <div className="flex items-center gap-2">
                        <Sprite name={label} />
                        <div className="text-lg">
                          {dataIntoDeck.total_wins}-{dataIntoDeck.total_losses}-{dataIntoDeck.total_ties}
                        </div>
                      </div>
                    )
                  }}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="win_rate" fill="hsl(var(--chart-2))" radius={[5, 0, 0, 5]} stackId='a' />
                <Bar dataKey="tie_rate" fill="hsl(var(--chart-4))" radius={[0, 0, 0, 0]} stackId='a' />
                <Bar dataKey="loss_rate" fill="hsl(var(--chart-1))" radius={[0, 5, 5, 0]} stackId='a' />
                <ChartLegend content={<ChartLegendContent />} />
              </BarChart>
            </ChartContainer>
              </TabsContent>
            )
          })}
        </Tabs>
      </CardContent>
    </Card>
  )
}