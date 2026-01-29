'use client';

import { useEffect } from "react";
import { useMatchups } from "@/hooks/matchups/useMatchups";
import { MatchupsFilterBar } from "./MatchupsFilterBar";
import { OverallPulse } from "./dashboard/OverallPulse";
import { TurnOrderImpact } from "./dashboard/TurnOrderImpact";
import { TimeTrends } from "./dashboard/TimeTrends";
import { BragAlertCards } from "./dashboard/BragAlertCards";
import { LastTenCard } from "./dashboard/LastTenCard";
import { StreakCard } from "./dashboard/StreakCard";
import { MatchupsOverview } from "./MatchupsOverview";
import { Skeleton } from "@/components/ui/skeleton";
import { useSetRecoilState } from "recoil";
import { rawMatchupsAtom } from "./recoil-matchups/deckMatchupAtom";

interface MatchupsDashboardProps {
  userId: string | undefined;
}

export const MatchupsDashboard = (props: MatchupsDashboardProps) => {
  const { data, isLoading } = useMatchups(props.userId);
  const setRaw = useSetRecoilState(rawMatchupsAtom);

  useEffect(() => {
    setRaw(data ?? null);
  }, [data, setRaw]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl tracking-wide font-semibold">Stats</h1>
          <p className="text-sm text-muted-foreground">
            Explore results by source, format, and turn order.
          </p>
        </div>
        <MatchupsFilterBar />
      </div>

      {isLoading && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      )}

      {!isLoading && (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <OverallPulse />
            <LastTenCard />
            <StreakCard />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TimeTrends />
            </div>
            <TurnOrderImpact />
          </div>

          <BragAlertCards />
        </>
      )}

      <div className="pt-2">
        <MatchupsOverview
          userId={props.userId}
          dataOverride={data ?? null}
          isLoadingOverride={isLoading}
          showFilterBar={false}
        />
      </div>
    </div>
  );
};
