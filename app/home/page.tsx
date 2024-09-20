import { redirect } from "next/navigation";

import TournamentCreate from "@/components/tournaments/TournamentCreate";
import { MyTournamentPreviews } from "@/components/tournaments/Preview/MyTournamentPreviews";
import { fetchCurrentUser } from "@/components/auth.utils";
import { AvatarSelector } from "@/components/avatar/AvatarSelector";
import { ScreenNameEditable } from "@/components/screen-name/ScreenNameEditable";
import { Trophy } from "lucide-react";
import { BattleLogsContainer } from "@/components/battle-logs/BattleLogsContainer";
import { fetchUserData } from "@/components/user-data.utils";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Profile() {
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <BattleLogsContainer />
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <Trophy className="h-4 w-4" />
            <h2 className="scroll-m-20 text-xl font-semibold">Tournaments</h2>
          </div>

          <MyTournamentPreviews user={user} />
          <TournamentCreate userId={user.id} />
        </div>
      </div>
    </div>
  );
}
