import { createClient } from "@/utils/supabase/server";
import { User } from "@supabase/supabase-js";
import TournamentPreview from "./TournamentPreview";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TournamentCategoryTab, allTournamentCategoryTabs, displayTournamentCategoryTab } from "../Category/tournament-category.types";
import { Database } from "@/database.types";
import { TournamentCategoryIcon } from "../Category/TournamentCategoryIcon";

interface MyTournamentPreviewsProps {
  user: User | null;
}

export async function MyTournamentPreviews (props: MyTournamentPreviewsProps) {
  const supabase = createClient();
  const { data: tournamentData } = await supabase.from('tournaments').select('*').eq('user', props.user?.id).order('date_from', { ascending: false }).returns<Database['public']['Tables']['tournaments']['Row'][]>();

  if (tournamentData && tournamentData?.length === 0) {
    return (
      <Card className="border-none">
        <CardHeader className="px-2">
          <CardDescription>You can add tournaments from the past, present, or future.</CardDescription>
          <CardDescription>Click Add Tournament to get started!</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const availableTournamentCategories: TournamentCategoryTab[] = allTournamentCategoryTabs.filter((cat) => (cat === 'all') || tournamentData?.some((tournament) => tournament.category === cat));

  return (
    <Tabs defaultValue='all'>
    <TabsList>
      {availableTournamentCategories.map((cat) => (
        <TabsTrigger key={cat} value={cat}>{cat === 'all' ? 'All' : <TournamentCategoryIcon category={cat} />}{cat !== 'all' && tournamentData?.filter((tournament) => tournament.category === cat).length}</TabsTrigger>
      ))}
    </TabsList>
    <TabsContent value='all'>
      <div className="flex flex-col gap-2">
        {tournamentData?.map((tournament) => (
            <TournamentPreview tournament={tournament}/>
        ))}
      </div>
    </TabsContent>
    {availableTournamentCategories.filter((cat) => cat !== 'all').map((cat) => (
      <TabsContent value={cat}>
        <ScrollArea className="h-[36rem] pr-4">
          <div className="flex flex-col gap-2">
            {tournamentData?.filter((tournament) => tournament.category === cat).map((tournament) => (
              <TournamentPreview tournament={tournament} shouldHideCategoryBadge />
            ))}
          </div>
        </ScrollArea>
      </TabsContent>
    ))}
  </Tabs>
  )
}