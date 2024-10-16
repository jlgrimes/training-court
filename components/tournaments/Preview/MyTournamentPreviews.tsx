'use client';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface MyTournamentPreviewsProps {
  user: User | null;
  tournaments: Database['public']['Tables']['tournaments']['Row'][] | null;
  rounds: Database['public']['Tables']['tournament rounds']['Row'][] | null;
}

export function MyTournamentPreviews (props: MyTournamentPreviewsProps) {
  const [selectedCat, setSelectedCat] = useState<TournamentCategoryTab>('all');

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
    <div className="flex flex-col gap-2">
      <Select defaultValue='all' onValueChange={(val) => setSelectedCat(val as unknown as TournamentCategoryTab)}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    {availableTournamentCategories.map((cat) => (
        <SelectItem key={cat} value={cat}>
          <div className="flex justify-between w-full items-center">
          {cat !== 'all' && <TournamentCategoryIcon category={cat} />}
            <p>{displayTournamentCategoryTab(cat)} ({props.tournaments?.filter((tournament) => cat === 'all' ? true : tournament.category === cat).length})</p>
            </div>
        </SelectItem>
      ))}
  </SelectContent>
</Select>
    {selectedCat === 'all' && (
      <div className="flex flex-col gap-2">
        {props.tournaments?.map((tournament) => props.rounds && (
            <TournamentPreview tournament={tournament} rounds={getTournamentRoundsFromUserRounds(props.rounds, tournament)}/>
        ))}
      </div>
    )}
    {selectedCat !== 'all' && (
      availableTournamentCategories.filter((cat) => cat === selectedCat).map((cat) => (
        <ScrollArea className="h-[36rem] pr-4">
          <div className="flex flex-col gap-2">
            {props.tournaments?.filter((tournament) => tournament.category === cat).map((tournament) => props.rounds && (
              <TournamentPreview tournament={tournament} rounds={getTournamentRoundsFromUserRounds(props.rounds, tournament)} shouldHideCategoryBadge />
            ))}
          </div>
        </ScrollArea>
      ))
    )}
    </div>
  )
}