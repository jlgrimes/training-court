import { redirect } from "next/navigation";

import { fetchCurrentUser } from "@/components/auth.utils";
import { BattleLogsHomePreview } from "@/components/battle-logs/BattleLogsHome/BattleLogsHomePreview";
import { TournamentsHomePreview } from "@/components/tournaments/TournamentsHome/TournamentsHomePreview";
import { isPremiumUser } from "@/components/premium/premium.utils";
import { Matchups } from "@/components/premium/matchups/Matchups";
import { TrainingCourtWelcome } from "@/components/TrainingCourtWelcome";

export default async function Profile() {
  const user = await fetchCurrentUser();

  if (!user) {
    return redirect("/");
  }

  return (
    <div className="flex flex-col py-4 pl-8 pr-6 gap-6 w-full h-full">
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
    </div>
  );
}
