import { redirect } from "next/navigation";

import { fetchCurrentUser } from "@/components/auth.utils";
import { AvatarSelector } from "@/components/avatar/AvatarSelector";
import { ScreenNameEditable } from "@/components/screen-name/ScreenNameEditable";
import { fetchUserData } from "@/components/user-data.utils";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TournamentsHomePage } from "@/components/tournaments/TournamentsHome/TournamentsHomePage";

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

      <TournamentsHomePage user={user} />
    </div>
  );
}
