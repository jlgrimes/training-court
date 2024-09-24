import { redirect } from "next/navigation";

import TournamentCreate from "@/components/tournaments/TournamentCreate";
import { MyTournamentPreviews } from "@/components/tournaments/Preview/MyTournamentPreviews";
import { fetchCurrentUser } from "@/components/auth.utils";
import { AvatarSelector } from "@/components/avatar/AvatarSelector";
import { ScreenNameEditable } from "@/components/screen-name/ScreenNameEditable";
import { BattleLogsContainer } from "@/components/battle-logs/BattleLogsContainer";
import { fetchUserData } from "@/components/user-data.utils";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isPremiumUser } from "@/components/premium/premium.utils";
import { PremiumTournamentCharts } from "@/components/premium/tournaments/PremiumTournamentCharts";
import Link from "next/link";

export default async function Tournaments() {
  const user = await fetchCurrentUser();
  const userData = user ? await fetchUserData(user.id) : null;

  if (!user) {
    return redirect("/");
  }

  return (
    <div className="flex flex-col py-4 lg:py-8 pl-8 pr-6 lg:px-16 gap-4 w-full h-full">
      {!userData?.live_screen_name && (
        <Card className="px-1 py-2">
          <CardHeader>
            <CardTitle>Welcome to Training Court</CardTitle>
            <CardDescription>Enter your PTCG Live screen name and pick an avatar to get started!</CardDescription>
          </CardHeader>
        </Card>
      )}
      <div className="flex items-center gap-4">
        <AvatarSelector userId={user.id} />
        <ScreenNameEditable userId={user.id} />
      </div>

      <Tabs defaultValue="tournaments">
        <TabsList className="mb-2">
          <Link href='/home'>
            <TabsTrigger value="battle-logs">
              Battle Logs
            </TabsTrigger>
          </Link>
          <TabsTrigger value="tournaments">
            Tournaments
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <div className="flex flex-col gap-4">
            <TournamentCreate userId={user.id} />
            {isPremiumUser(user) && <PremiumTournamentCharts userId={user.id} />}
          </div>
        </div>
        <MyTournamentPreviews user={user} />
      </div>
    </div>
  );
}
