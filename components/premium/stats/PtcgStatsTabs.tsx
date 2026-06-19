"use client";

import { T } from "gt-react";

import { CardUsageStats } from "@/components/premium/card-usage/CardUsageStats";
import { MatchupsOverview } from "@/components/premium/matchups/MatchupsOverview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type PtcgStatsTabsProps = {
  userId: string;
  currentUserScreenName: string | null;
};

export const PtcgStatsTabs = (props: PtcgStatsTabsProps) => {
  return (
    <Tabs defaultValue="matchups" className="w-full">
      <TabsList className="mb-2">
        <TabsTrigger value="matchups">
          <T id="stats.tabs.matchups">Matchups</T>
        </TabsTrigger>
        <TabsTrigger value="card-usage">
          <T id="stats.tabs.cardUsage">Card Usage</T>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="matchups">
        <MatchupsOverview userId={props.userId} shouldDisableDrillDown />
      </TabsContent>
      <TabsContent value="card-usage">
        <CardUsageStats
          userId={props.userId}
          currentUserScreenName={props.currentUserScreenName}
        />
      </TabsContent>
    </Tabs>
  );
};
