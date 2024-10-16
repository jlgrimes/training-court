import { createClient } from "@/utils/supabase/server";
import { User } from "@supabase/supabase-js";
import TournamentPreview from "./TournamentPreview";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TournamentCategoryTab, allTournamentCategoryTabs, displayTournamentCategoryTab } from "../Category/tournament-category.types";
import { Database } from "@/database.types";
import { TournamentCategoryIcon } from "../Category/TournamentCategoryIcon";
import { fetchRoundsForUser } from "../utils/tournaments.server.utils";
import { getTournamentRoundsFromUserRounds } from "../utils/tournaments.utils";

interface MyTournamentPreviewsProps {
  user: User | null;
  tournaments: Database['public']['Tables']['tournaments']['Row'][] | null;
  rounds: Database['public']['Tables']['tournament rounds']['Row'][] | null;
}

export async function MyTournamentPreviews (props: MyTournamentPreviewsProps) {
  if (props.tournaments && props.tournaments?.length === 0) {
    return (
      <Card className="border-none">
        <CardHeader className="px-2">
          <CardDescription>You can add tournaments from the past, present, or future.</CardDescription>
          <CardDescription>Click New Tournament to get started!</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const availableTournamentCategories: TournamentCategoryTab[] = allTournamentCategoryTabs.filter((cat) => (cat === 'all') || props.tournaments?.some((tournament) => tournament.category === cat));

  return (
    <Tabs defaultValue='all'>
    <TabsList>
      {availableTournamentCategories.map((cat) => (
        <TabsTrigger key={cat} value={cat}>{cat === 'all' ? 'All' : <TournamentCategoryIcon category={cat} />}{cat !== 'all' && props.tournaments?.filter((tournament) => tournament.category === cat).length}</TabsTrigger>
      ))}
    </TabsList>
    <TabsContent value='all'>
      <div className="flex flex-col gap-2">
        {props.tournaments?.map((tournament) => props.rounds && (
            <TournamentPreview tournament={tournament} rounds={getTournamentRoundsFromUserRounds(props.rounds, tournament)}/>
        ))}
      </div>
    </TabsContent>
    {availableTournamentCategories.filter((cat) => cat !== 'all').map((cat) => (
      <TabsContent value={cat}>
        <ScrollArea className="h-[36rem] pr-4">
          <div className="flex flex-col gap-2">
            {props.tournaments?.filter((tournament) => tournament.category === cat).map((tournament) => props.rounds && (
              <TournamentPreview tournament={tournament} rounds={getTournamentRoundsFromUserRounds(props.rounds, tournament)} shouldHideCategoryBadge />
            ))}
          </div>
        </ScrollArea>
      </TabsContent>
    ))}
  </Tabs>
  )
}