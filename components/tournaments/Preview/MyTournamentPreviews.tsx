'use client';

import { User } from "@supabase/supabase-js";
import TournamentPreview from "./TournamentPreview";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TournamentCategoryTab, allTournamentCategoryTabs, displayTournamentCategoryTab } from "../Category/tournament-category.types";
import { Database } from "@/database.types";
import { TournamentCategoryIcon } from "../Category/TournamentCategoryIcon";
import { getTournamentRoundsFromUserRounds } from "../utils/tournaments.utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useTournaments } from "@/hooks/tournaments/useTournaments";
import { useTournamentRounds } from "@/hooks/tournaments/useTournamentRounds";

interface MyTournamentPreviewsProps {
  user: User | null;
}

export function MyTournamentPreviews (props: MyTournamentPreviewsProps) {
  const { data: tournaments } = useTournaments(props.user?.id);
  const { data: rounds } = useTournamentRounds(props.user?.id);

  const [selectedCat, setSelectedCat] = useState<TournamentCategoryTab>('all');

  if (tournaments && tournaments?.length === 0) {
    return (
      <Card className="border-none">
        <CardHeader className="px-2">
          <CardDescription>You can add tournaments from the past, present, or future.</CardDescription>
          <CardDescription>Click New Tournament to get started!</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const availableTournamentCategories: TournamentCategoryTab[] = allTournamentCategoryTabs.filter((cat) => (cat === 'all') || tournaments?.some((tournament) => tournament.category === cat));

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
            <p>{displayTournamentCategoryTab(cat)} ({tournaments?.filter((tournament) => cat === 'all' ? true : tournament.category === cat).length})</p>
            </div>
        </SelectItem>
      ))}
  </SelectContent>
</Select>
    {selectedCat === 'all' && (
      <div className="flex flex-col gap-2">
        {tournaments?.map((tournament) => rounds && (
            <TournamentPreview tournament={tournament} rounds={getTournamentRoundsFromUserRounds(rounds, tournament)}/>
        ))}
      </div>
    )}
    {selectedCat !== 'all' && (
      availableTournamentCategories.filter((cat) => cat === selectedCat).map((cat) => (
        <ScrollArea className="h-[36rem] pr-4">
          <div className="flex flex-col gap-2">
            {tournaments?.filter((tournament) => tournament.category === cat).map((tournament) => rounds && (
              <TournamentPreview tournament={tournament} rounds={getTournamentRoundsFromUserRounds(rounds, tournament)} shouldHideCategoryBadge />
            ))}
          </div>
        </ScrollArea>
      ))
    )}
    </div>
  )
}