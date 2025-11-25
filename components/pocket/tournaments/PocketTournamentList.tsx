'use client';

import { useMemo, useState } from 'react';
import { usePocketTournaments } from '@/hooks/pocket/tournaments/usePocketTournaments';
import { usePocketTournamentRounds } from '@/hooks/pocket/tournaments/usePocketTournamentRounds';
import { Card, CardDescription, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MultiSelect from '@/components/ui/multi-select';
import { TournamentCategory, TournamentCategoryTab, allTournamentCategoryTabs, displayTournamentCategoryTab } from '@/components/tournaments/Category/tournament-category.types';
import { TournamentCategoryIcon } from '@/components/tournaments/Category/TournamentCategoryIcon';
import { TournamentFormatsTab } from '@/components/tournaments/Format/tournament-format.types';
import PocketTournamentPreview from './PocketTournamentPreview';

interface PocketTournamentListProps {
  userId: string;
}

export function PocketTournamentList({ userId }: PocketTournamentListProps) {
  const { data: tournaments } = usePocketTournaments(userId);
  const { data: rounds } = usePocketTournamentRounds(userId);

  const [selectedCats, setSelectedCats] = useState<TournamentCategoryTab[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<TournamentFormatsTab>('All');

  const availableTournamentCategories = useMemo(
    () =>
      allTournamentCategoryTabs
        .filter((cat) => cat !== 'all')
        .map((cat) => ({
          value: cat,
          label: `${displayTournamentCategoryTab(cat)} (${
            tournaments?.filter(
              (t) => t.category === cat && (t.format === selectedFormat || selectedFormat === 'All')
            ).length ?? 0
          })`,
          icon: <TournamentCategoryIcon category={cat as TournamentCategory} />,
        })),
    [tournaments, selectedFormat]
  );

  const availableFormats: TournamentFormatsTab[] = ['All'];
  tournaments?.forEach((tournament) => {
    if (tournament.format && !availableFormats.includes(tournament.format as TournamentFormatsTab)) {
      availableFormats.push(tournament.format as TournamentFormatsTab);
    }
  });

  const filteredTournaments = tournaments?.filter(
    (tournament) =>
      (selectedCats.length === 0 || selectedCats.includes(tournament.category as TournamentCategoryTab)) &&
      (selectedFormat === 'All' || tournament.format === selectedFormat)
  );

  if (tournaments && tournaments.length === 0) {
    return (
      <Card className='border-none'>
        <CardHeader className='px-2'>
          <CardDescription>You can add Pocket tournaments from the past, present, or future.</CardDescription>
          <CardDescription>Click New Tournament to get started!</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex gap-2'>
        <MultiSelect
          options={availableTournamentCategories}
          value={selectedCats}
          onChange={(vals) => setSelectedCats(vals as TournamentCategoryTab[])}
          placeholder='All Categories'
        />

        <Select value={selectedFormat} onValueChange={(val) => setSelectedFormat(val as TournamentFormatsTab)}>
          <SelectTrigger>
            <SelectValue>{selectedFormat === 'All' ? 'All Formats' : selectedFormat}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableFormats.map((format) => (
              <SelectItem key={format} value={format}>
                <div className='flex justify-between w-full items-center'>
                  <p>
                    {format === 'All' ? 'All Formats' : format} (
                    {tournaments?.filter((t) => (format === 'All' ? true : t.format === format)).length})
                  </p>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        {filteredTournaments?.length === 0 && (
          <Card className='border-none'>
            <CardHeader className='px-2'>
              <CardDescription>No Pocket tournaments found for the selected category and format.</CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className='flex flex-col gap-2'>
          {filteredTournaments?.map((tournament) =>
            rounds ? (
              <PocketTournamentPreview
                key={tournament.id}
                tournament={tournament}
                rounds={rounds.filter((r) => r.tournament === tournament.id)}
              />
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}
