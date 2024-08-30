import { Sprite } from "@/components/archetype/Sprite";
import { parseBattleLog } from "@/components/battle-logs/utils/battle-log.utils";
import { createClient } from "@/utils/supabase/server";
import { formatDistanceToNowStrict } from "date-fns";
import { redirect } from "next/navigation";

export default async function About() {

  return (
    <div className="flex-1 flex flex-col w-full h-full p-8 sm:max-w-lg gap-2">
      <h1>About</h1>
      <p>Buddy poffin is</p>
    </div>
  );
}
