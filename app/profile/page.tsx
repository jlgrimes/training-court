import { redirect } from "next/navigation";

import { AddBattleLogInput } from "@/components/battle-logs/AddBattleLogInput";
import { MyBattleLogPreviews } from "@/components/battle-logs/MyBattleLogPreviews";
import TournamentCreate from "@/components/tournaments/TournamentCreate";
import { MyTournamentPreviews } from "@/components/tournaments/MyTournamentPreviews";
import { fetchCurrentUser } from "@/components/auth.utils";
import { AvatarSelector } from "@/components/avatar/AvatarSelector";
import { ScreenNameEditable } from "@/components/screen-name/ScreenNameEditable";
import { RadioTower, Trophy } from "lucide-react";

export default async function Profile() {
  const user = await fetchCurrentUser();

  if (!user) {
    return redirect("/login");
  }

  return (
    <div className="flex flex-col py-8 px-16 gap-4 w-full h-full">
      <div className="flex items-center gap-4">
        <AvatarSelector userId={user.id} />
        <ScreenNameEditable userId={user.id} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 items-center">
            <RadioTower className="h-4 w-4" />
            <h2 className="scroll-m-20 text-xl font-semibold tracking-tight">PTCG Live</h2>
          </div>

          <AddBattleLogInput user={user} />
          <MyBattleLogPreviews user={user} />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 items-center">
            <Trophy className="h-4 w-4" />
            <h2 className="scroll-m-20 text-xl font-semibold tracking-tight">Tournaments</h2>
          </div>
          
          <MyTournamentPreviews user={user} />
          <TournamentCreate userId={user.id} />
        </div>
      </div>
    </div>
  );
}
