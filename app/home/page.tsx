import { redirect } from "next/navigation";

import { fetchCurrentUser } from "@/components/auth.utils";
import { fetchUserData } from "@/components/user-data.utils";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BattleLogsHomePreview } from "@/components/battle-logs/BattleLogsHome/BattleLogsHomePreview";
import { TournamentsHomePreview } from "@/components/tournaments/TournamentsHome/TournamentsHomePreview";
import { AvatarSelector } from "@/components/avatar/AvatarSelector";
import { ScreenNameEditable } from "@/components/screen-name/ScreenNameEditable";

export default async function Profile() {
  const user = await fetchCurrentUser();
  const userData = user ? await fetchUserData(user.id) : null;

  if (!user) {
    return redirect("/");
  }

  return (
    <div className="flex flex-col py-6 lg:py-8 pl-8 pr-6 lg:px-16 gap-6 w-full h-full">
      {!userData?.live_screen_name && (
        <Card className="px-1 py-2">
          <CardHeader>
            <CardTitle>Welcome to Training Court</CardTitle>
            <CardDescription>Enter your PTCG Live screen name and pick an avatar to get started!</CardDescription>
            <AvatarSelector userId={user.id} />
            <ScreenNameEditable userId={user.id} />
          </CardHeader>
        </Card>
      )}

      {/* {isUserAnAdmin(user.id) && <FriendsDisplay userId={user.id} />} */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <BattleLogsHomePreview userData={userData} />
        <TournamentsHomePreview user={user} />
      </div>
    </div>
  );
}
