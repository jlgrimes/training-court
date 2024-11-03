import { redirect } from "next/navigation";

import { fetchCurrentUser } from "@/components/auth.utils";
import { TournamentsHomePage } from "@/components/tournaments/TournamentsHome/TournamentsHomePage";
import { Metadata } from "next";
import { TrainingCourtWelcome } from "@/components/TrainingCourtWelcome";

export const metadata: Metadata = {
  title: 'Tournaments',
};

export default async function Tournaments() {
  const user = await fetchCurrentUser();

  if (!user) {
    return redirect("/");
  }

  return (
    <div className="flex flex-col py-4 pl-8 pr-6 gap-4 w-full h-full">
      <TrainingCourtWelcome userId={user.id} />
      <TournamentsHomePage user={user} />
    </div>
  );
}
