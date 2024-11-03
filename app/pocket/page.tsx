import { redirect } from "next/navigation";

import { fetchCurrentUser } from "@/components/auth.utils";
import { AddPocketMatch } from "@/components/pocket/AddPocketMatch";
import { PocketMatchesList } from "@/components/pocket/PocketMatchesList";

export default async function Pocket() {
  const user = await fetchCurrentUser();

  if (!user) {
    return redirect("/");
  }

  return (
    <div className="flex flex-col py-4 lg:py-6 pl-8 pr-6 lg:px-16 gap-6 w-full h-full">
      <div className="flex flex-col gap-4 items-start">
        <AddPocketMatch userId={user.id} />
        <PocketMatchesList userId={user.id} />
      </div>
    </div>
  );
}
