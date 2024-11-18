import { redirect } from "next/navigation";

import { fetchCurrentUser } from "@/components/auth.utils";
import { AddPocketMatch } from "@/components/pocket/AddPocketMatch";
import { PocketMatchesList } from "@/components/pocket/PocketMatchesList";
import { Header } from "@/components/ui/header";

export default async function Pocket() {
  const user = await fetchCurrentUser();

  if (!user) {
    return redirect("/");
  }

  return (
    <div className="flex flex-col py-4 pl-8 pr-6 gap-6 w-full h-full">
      <Header
        description="Record your games from PTCG Pocket"
        actionButton={<AddPocketMatch userId={user.id} />}
      >
        Pocket Games
      </Header>
      <PocketMatchesList userId={user.id} />
    </div>
  );
}
