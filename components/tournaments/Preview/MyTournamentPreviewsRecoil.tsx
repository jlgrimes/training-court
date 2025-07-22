'use client';

import TournamentPreview from "./TournamentPreview";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TournamentCategoryTab, allTournamentCategoryTabs, displayTournamentCategoryTab } from "../Category/tournament-category.types";
import { TournamentCategoryIcon } from "../Category/TournamentCategoryIcon";
import { getTournamentRoundsFromUserRounds } from "../utils/tournaments.utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import { TournamentFormatsTab } from "../Format/tournament-format.types";
import { useTournaments } from "@/app/recoil/hooks/useTournaments";
import { useAuth } from "@/app/recoil/hooks/useAuth";
import { createClient } from "@/utils/supabase/client";
import { Tournament } from "@/app/recoil/atoms/tournaments";

export function MyTournamentPreviewsRecoil() {
  const { user, isAuthenticated } = useAuth();
  const {
    sortedTournaments,
    filter,
    setFilterField,
    loadTournaments,
    loading,
  } = useTournaments();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isInteractionBlocked, setIsInteractionBlocked] = useState(false);
  const [selectedCat, setSelectedCat] = useState<TournamentCategoryTab>('all');
  const [selectedFormat, setSelectedFormat] = useState<TournamentFormatsTab>('All');

  // Load tournaments on mount
  useEffect(() => {
    if (!user?.id) return;

    const fetchTournaments = async () => {
      try {
        const supabase = createClient();
        const { data: tournamentsData, error: tournamentsError } = await supabase
          .from('tournaments')
          .select('*')
          .eq('user', user.id)
          .order('date_from', { ascending: false });

        if (tournamentsError) throw tournamentsError;

        const { data: roundsData, error: roundsError } = await supabase
          .from('tournament rounds')
          .select('*')
          .eq('user', user.id);

        if (roundsError) throw roundsError;

        if (tournamentsData) {
          const tournaments: Tournament[] = tournamentsData.map(t => ({
            id: t.id,
            name: t.name,
            deckName: t.deckname ?? '',
            deckList: t.decklist ?? undefined,
            roundsDay1: t.rounds_day_1 ?? undefined,
            roundsDay2: t.rounds_day_2 ?? undefined,
            startDate: t.date_from ?? undefined,
            endDate: t.date_to ?? undefined,
            placement: t.placement ?? undefined,
            playersCount: t.players_count ?? undefined,
            user: t.user ?? undefined,
            rounds: roundsData ? roundsData.filter(r => r.tournament_id === t.id).map(r => ({
              id: r.id,
              tournamentId: r.tournament_id,
              roundNumber: r.round_num ?? 0,
              opponentDeck: r.opp_archetype ?? undefined,
              win: r.win ?? undefined,
              loss: r.loss ?? undefined,
              tie: r.tie ?? undefined,
              tableName: r.table_num ?? undefined,
              day: r.day ?? undefined,
              notes: r.notes ?? undefined,
            })) : undefined,
            createdAt: t.created_at ?? undefined,
            updatedAt: t.updated_at ?? undefined,
          }));

          loadTournaments(tournaments);
        }
      } catch (error) {
        console.error('Failed to load tournaments:', error);
      }
    };

    fetchTournaments();
  }, [user?.id, loadTournaments]);

  const handleDropdownOpenChange = (open: boolean) => {
    setIsDropdownOpen(open);
    if (!open) {
      setIsInteractionBlocked(true);
      setTimeout(() => setIsInteractionBlocked(false), 300);
    }
  };

  const availableTournamentCategories = useMemo(() =>
    allTournamentCategoryTabs.filter(
      (cat) => cat === 'all' || sortedTournaments?.some((tournament) => 
        // Add category field when it exists in the tournament type
        false
      )
    ), 
    [sortedTournaments]
  );

  const availableFormats: TournamentFormatsTab[] = ['All'];
  sortedTournaments?.forEach((tournament) => {
    // Add format field when it exists in the tournament type
  });

  const filteredTournaments = sortedTournaments?.filter((tournament) =>
    (selectedCat === 'all') && (selectedFormat === 'All')
  );

  if (!isAuthenticated) {
    return (
      <Card className="border-none">
        <CardHeader className="px-2">
          <CardDescription>Please log in to view your tournaments.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="border-none">
        <CardHeader className="px-2">
          <CardDescription>Loading tournaments...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (sortedTournaments && sortedTournaments?.length === 0) {
    return (
      <Card className="border-none">
        <CardHeader className="px-2">
          <CardDescription>You can add tournaments from the past, present, or future.</CardDescription>
          <CardDescription>Click New Tournament to get started!</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Select 
          defaultValue="all" 
          onValueChange={(val) => setSelectedCat(val as TournamentCategoryTab)} 
          open={isDropdownOpen} 
          onOpenChange={handleDropdownOpenChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {availableTournamentCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                <div className="flex justify-between w-full items-center">
                  {cat !== 'all' && <TournamentCategoryIcon category={cat} />}
                  <p>
                    {displayTournamentCategoryTab(cat)} (
                    {sortedTournaments?.filter((tournament) => cat === 'all' ? true : false).length})
                  </p>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedFormat} onValueChange={(val) => setSelectedFormat(val as TournamentFormatsTab)}>
          <SelectTrigger>
            <SelectValue>{selectedFormat === 'All' ? 'All Formats' : selectedFormat}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableFormats.map((format) => (
              <SelectItem key={format} value={format}>
                <div className="flex justify-between w-full items-center">
                  <p>
                    {format === 'All' ? 'All Formats' : format} (
                    {sortedTournaments?.filter((tournament) => format === 'All' ? true : false).length})
                  </p>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={isInteractionBlocked ? 'pointer-events-none' : ''}>
        {filteredTournaments?.length === 0 && (
          <Card className="border-none">
            <CardHeader className="px-2">
              <CardDescription>No tournaments found for the selected category and format.</CardDescription>
            </CardHeader>
          </Card>
        )}

        {selectedCat === 'all' ? (
          <div className="flex flex-col gap-2">
            {filteredTournaments?.map((tournament) => (
              <TournamentPreview
                key={tournament.id}
                tournament={{
                  id: tournament.id,
                  name: tournament.name,
                  deckname: tournament.deckName,
                  date_from: tournament.startDate || '',
                  date_to: tournament.endDate || '',
                  placement: tournament.placement || null,
                  players_count: tournament.playersCount || null,
                  decklist: tournament.deckList || null,
                  rounds_day_1: tournament.roundsDay1 || null,
                  rounds_day_2: tournament.roundsDay2 || null,
                  user: tournament.user || '',
                  created_at: tournament.createdAt || '',
                  updated_at: tournament.updatedAt || null,
                  category: null,
                  format: null,
                }}
                rounds={tournament.rounds?.map(r => ({
                  id: r.id || '',
                  tournament_id: r.tournamentId || '',
                  round_num: r.roundNumber,
                  opp_archetype: r.opponentDeck || null,
                  win: r.win || null,
                  loss: r.loss || null,
                  tie: r.tie || null,
                  table_num: r.tableName || null,
                  day: r.day || null,
                  notes: r.notes || null,
                  user: tournament.user || null,
                  created_at: '',
                })) || []}
              />
            ))}
          </div>
        ) : (
          <ScrollArea className="h-[36rem]">
            <div className="flex flex-col gap-2">
              {filteredTournaments?.map((tournament) => (
                <TournamentPreview
                  key={tournament.id}
                  tournament={{
                    id: tournament.id,
                    name: tournament.name,
                    deckname: tournament.deckName,
                    date_from: tournament.startDate || '',
                    date_to: tournament.endDate || '',
                    placement: tournament.placement || null,
                    players_count: tournament.playersCount || null,
                    decklist: tournament.deckList || null,
                    rounds_day_1: tournament.roundsDay1 || null,
                    rounds_day_2: tournament.roundsDay2 || null,
                    user: tournament.user || '',
                    created_at: tournament.createdAt || '',
                    updated_at: tournament.updatedAt || null,
                    category: null,
                    format: null,
                  }}
                  rounds={tournament.rounds?.map(r => ({
                    id: r.id || '',
                    tournament_id: r.tournamentId || '',
                    round_num: r.roundNumber,
                    opp_archetype: r.opponentDeck || null,
                    win: r.win || null,
                    loss: r.loss || null,
                    tie: r.tie || null,
                    table_num: r.tableName || null,
                    day: r.day || null,
                    notes: r.notes || null,
                    user: tournament.user || null,
                    created_at: '',
                  })) || []}
                  shouldHideCategoryBadge
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}