import { redirect } from "next/navigation";

import { fetchCurrentUser } from "@/components/auth.utils";
import { BattleLogsHomePreview } from "@/components/battle-logs/BattleLogsHome/BattleLogsHomePreview";
import { TournamentsHomePreview } from "@/components/tournaments/TournamentsHome/TournamentsHomePreview";
import { isPremiumUser } from "@/components/premium/premium.utils";
import { Matchups } from "@/components/premium/matchups/Matchups";
import { TrainingCourtWelcome } from "@/components/TrainingCourtWelcome";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddPocketMatch } from "@/components/pocket/AddPocketMatch";
import { PocketMatchesList } from "@/components/pocket/PocketMatchesList";

export default async function Profile() {
  const user = await fetchCurrentUser();

  if (!user) {
    return redirect("/");
  }

  return (
    <div className="flex flex-col py-4 lg:py-6 pl-8 pr-6 lg:px-16 gap-6 w-full h-full">
      <Tabs defaultValue="tcg">
        <TabsList className="mb-2">
          <TabsTrigger value='tcg'>TCG</TabsTrigger>
          <TabsTrigger value='pocket'>Pocket</TabsTrigger>
        </TabsList>
        <TabsContent value="tcg">
            <TrainingCourtWelcome userId={user.id} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <BattleLogsHomePreview userId={user.id} />
              <TournamentsHomePreview user={user} />
            </div>
            {isPremiumUser(user.id) && (
              <Matchups
                userId={user.id}
                shouldDisableDrillDown
              />
            )}
        </TabsContent>
        <TabsContent value="pocket">
          <div className="flex flex-col gap-4 items-start">
            <AddPocketMatch userId={user.id} />
            <PocketMatchesList userId={user.id} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
