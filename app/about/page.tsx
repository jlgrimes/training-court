import { Sprite } from "@/components/archetype/Sprite";
import { parseBattleLog } from "@/components/battle-logs/utils/battle-log.utils";
import { createClient } from "@/utils/supabase/server";
import { formatDistanceToNowStrict } from "date-fns";
import { redirect } from "next/navigation";

export default async function About() {

  return (
    <div className="flex-1 flex flex-col w-full h-full p-8 sm:max-w-2xl gap-4">
      <p>
        Buddy Poffin was made to consolidate all of your tournaments and practice rounds
        for the Pokemon Trading Card Game. It was made to be as easy-to-use and accessible
        as possible, with the player at the forefront of design.
      </p>
      <p>
        You can import logs from PTCG Live, and see turns displayed in a beautiful format
        that's miles better than the wall of text the battle log gives you. Visualizing
        the game like this will help with understanding mistakes made in practice, and
        help in future matches.
      </p>
      <p>
        You can also track tournaments you play in, including what decks you play against and
        individual game records for each round. This information persists to your user account,
        so you'll always be able to go back and see the games you've played in.
      </p>
    </div>
  );
}
