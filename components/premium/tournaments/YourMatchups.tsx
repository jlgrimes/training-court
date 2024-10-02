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
import { useEffect, useMemo, useState } from "react"
import { Sprite } from "@/components/archetype/sprites/Sprite"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PremiumIcon } from "../PremiumIcon"

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
  const [currentDeck, setCurrentDeck] = useState<string>();

  useEffect(() => {
    setCurrentDeck(props.matchupData?.[0].tournament_deck)
  }, [props.matchupData]);

  const yourDecks = useMemo(() => {
    return Array.from(new Set(props.matchupData?.map(({ tournament_deck }) => tournament_deck)));
  }, [props.matchupData]);

  if (!currentDeck) return null;

  const matchups = props.matchupData!.filter(({ tournament_deck }) => tournament_deck === currentDeck).slice(0, 10);
  const chartData = matchups.map(({ round_deck, win_rate, tie_rate, total_wins, total_losses, total_ties }) => ({
    round_deck,
    win_rate,
    tie_rate,
    loss_rate: 100 - win_rate - tie_rate,
    total_wins,
    total_losses,
    total_ties
  }))

  const formatDeckName = (deck: string): string => {
    // Here's where we can do aliasing. For instance - if the deck contains Roaring Moon and Flutter Mane we can call it 'Ancient Box'.
    return deck.split(',').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">Your matchup spread<PremiumIcon /></CardTitle>
        <Select value={currentDeck} onValueChange={(deck) => setCurrentDeck(deck)}>
          <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yourDecks.map((deck) => (
                <SelectItem value={deck}>
                  <div className="flex items-center gap-2">
                    <Sprite name={deck} small /> {formatDeckName(deck)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
      <div className="grid grid-cols-12 items-center">
                  <div className="flex flex-col h-full justify-evenly pb-8">
                    {chartData.map(({ round_deck }) => <Sprite name={round_deck} small />)}
                  </div>
                  <ChartContainer config={chartConfig} className={`col-span-11 aspect-square xl:aspect-video`}>
                    <BarChart
                      accessibilityLayer
                      data={chartData}
                      layout="vertical"
                      height={300}
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
                        hide
                        // tickFormatter={(value) =>
                        //   value
                        // }
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
                </div>
      </CardContent>
    </Card>
  )
}