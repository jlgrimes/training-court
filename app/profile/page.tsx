import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

import { AddBattleLogInput } from "@/components/battle-logs/AddBattleLogInput";
import { MyBattleLogPreviews } from "@/components/battle-logs/MyBattleLogPreviews";
import TournamentCreate from "@/components/tournaments/TournamentCreate";
import { MyTournamentPreviews } from "@/components/tournaments/MyTournamentPreviews";

export default async function Profile() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  return (
    <div className="flex flex-col py-4 px-8 gap-4 w-full h-full">
      <h1 className="scroll-m-20 text-3xl font-bold tracking-tight lg:text-4xl">Welcome!</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-4">
          <h2 className="scroll-m-20 text-xl font-semibold tracking-tight">Live Games</h2>
          <AddBattleLogInput user={user} />
          <MyBattleLogPreviews user={user} />
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="scroll-m-20 text-xl font-semibold tracking-tight">Tournaments</h2>
          <TournamentCreate userId={user.id} />
          <MyTournamentPreviews user={user} />
        </div>
      </div>
    </div>
  );
}
