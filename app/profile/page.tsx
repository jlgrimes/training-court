import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

import { AddBattleLogInput } from "@/components/battle-logs/AddBattleLogInput";
import { MyBattleLogPreviews } from "@/components/battle-logs/MyBattleLogPreviews";

export default async function Profile() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  return (
    <div className="flex-1 flex flex-col w-full h-full p-8 sm:max-w-lg justify-between gap-2">
      <div className="flex flex-col gap-4">
        <h1 className="scroll-m-20 text-3xl font-bold tracking-tight lg:text-4xl">Welcome!</h1>
        <h2 className="scroll-m-20 text-xl font-semibold tracking-tight">Live Games</h2>
        <AddBattleLogInput user={user} />
        <MyBattleLogPreviews user={user} />
      </div>
    </div>
  );
}
