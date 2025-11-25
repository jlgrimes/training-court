'use client';

import { useCallback, useMemo, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { parseISO } from 'date-fns';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Header } from '@/components/ui/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import {
  TournamentCategory,
  TournamentCategoryTab,
  displayTournamentCategory,
} from '@/components/tournaments/Category/tournament-category.types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TournamentFormats,
  tournamentFormats,
} from '@/components/tournaments/Format/tournament-format.types';
import {
  TournamentPlacement,
} from '@/components/tournaments/Placement/tournament-placement.types';
import { TournamentPlacementSelect } from '@/components/tournaments/Placement/TournamentPlacementSelect';
import {
  convertGameResultsToRoundResult,
  displayTournamentDate,
  getRecord,
  toUtcNoon,
} from '@/components/tournaments/utils/tournaments.utils';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type PocketTournament = {
  id: string;
  created_at: string;
  user: string;
  name: string;
  date_from: string;
  date_to: string;
  category: TournamentCategoryTab | null;
  format: TournamentFormats | null;
  deck: string | null;
  placement: string | null;
  notes: string | null;
};

type PocketRound = {
  id: string;
  tournament: string;
  round_num: number;
  result: string[];
  deck: string | null;
  created_at: string;
};

interface PocketTournamentContainerProps {
  tournament: PocketTournament;
  rounds: PocketRound[];
  currentUserId: string;
}

export function PocketTournamentContainer(props: PocketTournamentContainerProps) {
  const { toast } = useToast();
  const supabase = useMemo(() => createClient(), []);

  const [name, setName] = useState(props.tournament.name);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: parseISO(props.tournament.date_from),
    to: parseISO(props.tournament.date_to),
  });
  const [category, setCategory] = useState<TournamentCategory | null>(
    props.tournament.category as TournamentCategory | null
  );
  const [format, setFormat] = useState<TournamentFormats | null>(props.tournament.format);
  const [placement, setPlacement] = useState<TournamentPlacement | null>(
    props.tournament.placement as TournamentPlacement | null
  );
  const [notes, setNotes] = useState(props.tournament.notes ?? '');

  const [rounds, setRounds] = useState<PocketRound[]>(props.rounds);
  const [roundResult, setRoundResult] = useState<string>('W');
  const record = useMemo(() => getRecord(rounds), [rounds]);

  const isOwner = props.currentUserId === props.tournament.user;

  const handleSave = useCallback(async () => {
    if (!isOwner) return;
    if (!dateRange.from) return;
    const dateFromUTC = toUtcNoon(dateRange.from);
    const dateToUTC = toUtcNoon(dateRange.to ?? dateRange.from);

    const { error } = await supabase
      .from('pocket_tournaments')
      .update({
        name,
        date_from: dateFromUTC?.toISOString(),
        date_to: dateToUTC?.toISOString(),
        category,
        format,
        placement,
        notes,
      })
      .eq('id', props.tournament.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Could not save tournament',
        description: error.message,
      });
      return;
    }

    toast({ title: 'Tournament updated' });
  }, [category, dateRange, format, isOwner, name, notes, placement, props.tournament.id, supabase, toast]);

  const handleAddRound = useCallback(async () => {
    if (!isOwner) return;
    const nextRound = rounds.length + 1;
    const { data, error } = await supabase
      .from('pocket_tournament_rounds')
      .insert({
        tournament: props.tournament.id,
        user: props.currentUserId,
        round_num: nextRound,
        result: [roundResult],
      })
      .select();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Could not add round',
        description: error.message,
      });
      return;
    }

    setRounds((prev) => [...prev, ...(data as PocketRound[])]);
    toast({ title: 'Round added' });
  }, [isOwner, props.currentUserId, props.tournament.id, roundResult, rounds.length, supabase, toast]);

  return (
    <div className='flex flex-col gap-4'>
      <Header description='Edit your Pocket tournament and rounds'>Pocket Tournament</Header>

      <Card>
        <CardContent className='flex flex-col gap-4 pt-6'>
          <div className='flex flex-wrap items-start justify-between gap-2'>
            <div className='flex flex-col min-w-0 flex-1'>
              <h1 className='scroll-m-20 text-2xl font-bold tracking-tight'>{name}</h1>
              <h3 className='text-sm text-muted-foreground'>
                {displayTournamentDate(props.tournament.date_from, props.tournament.date_to)}
              </h3>
              <div className='flex flex-wrap gap-1 mt-1'>
                {category && (
                  <span className='text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground capitalize'>
                    {displayTournamentCategory(category as TournamentCategory)}
                  </span>
                )}
                {placement && (
                  <span className='text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground'>
                    {renderPlacement(placement as TournamentPlacement)}
                  </span>
                )}
                {format && (
                  <span className='text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground'>
                    {format}
                  </span>
                )}
              </div>
            </div>
            <div className='flex flex-col items-end shrink-0'>
              <h1 className='scroll-m-20 text-2xl font-bold tracking-tight'>{record}</h1>
              <p className='text-sm text-muted-foreground'>Deck: {props.tournament.deck ?? 'Unknown'}</p>
            </div>
          </div>

          <Separator />

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Tournament name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!isOwner} />
            </div>
            <div className='space-y-2'>
              <Label>Placement</Label>
              <TournamentPlacementSelect
                value={placement}
                onChange={(p: TournamentPlacement) => setPlacement(p)}
                disabled={!isOwner}
              />
            </div>
            <div className='space-y-2'>
              <Label>Date</Label>
              <DatePicker date={dateRange} setDate={setDateRange} disabled={!isOwner} />
            </div>
            <div className='space-y-2'>
              <Label>Category</Label>
              <Select
                value={category ?? undefined}
                onValueChange={(val) => setCategory(val as TournamentCategory)}
                disabled={!isOwner}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select category' />
                </SelectTrigger>
                <SelectContent>
                  {['locals', 'online', 'cup', 'regional', 'international', 'other'].map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {displayTournamentCategory(cat as TournamentCategory)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Format</Label>
              <Select
                value={format ?? undefined}
                onValueChange={(val) => setFormat(val as TournamentFormats)}
                disabled={!isOwner}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select format' />
                </SelectTrigger>
                <SelectContent>
                  {tournamentFormats.map((fmt) => (
                    <SelectItem key={fmt} value={fmt}>
                      {fmt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-2'>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Add notes about this tournament'
              disabled={!isOwner}
            />
          </div>

          <Button onClick={handleSave} disabled={!isOwner}>
            Save tournament
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className='space-y-4 pt-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-lg font-semibold'>Rounds</h3>
              <p className='text-sm text-muted-foreground'>{record}</p>
            </div>
            <div className='flex items-center gap-2'>
              <Label>Result</Label>
              <Select value={roundResult} onValueChange={(val) => setRoundResult(val)} disabled={!isOwner}>
                <SelectTrigger className='w-[120px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='W'>Win</SelectItem>
                  <SelectItem value='L'>Loss</SelectItem>
                  <SelectItem value='T'>Tie</SelectItem>
                </SelectContent>
              </Select>
              <Button size='sm' onClick={handleAddRound} disabled={!isOwner}>
                Add round {rounds.length + 1}
              </Button>
            </div>
          </div>

          <div className='grid grid-cols-8'>
            <div className='col-span-8 grid grid-cols-8 text-sm font-medium text-muted-foreground px-3 py-1'>
              <span className='col-span-2'>Round</span>
              <span className='col-span-5'>Deck</span>
              <span className='col-span-1 text-right'>Result</span>
            </div>
            {rounds.map((round) => {
              const r = convertGameResultsToRoundResult(round.result);
              return (
                <div
                  key={round.id}
                  className={cn(
                    'col-span-8 grid grid-cols-8 items-center px-4 border-b h-12',
                    r === 'W' && 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-300',
                    r === 'T' && 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300',
                    r === 'L' && 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-300'
                  )}
                >
                  <span className='col-span-2 font-bold text-sm'>{round.round_num}</span>
                  <span className='col-span-5'>{round.deck ?? 'Unknown'}</span>
                  <span className='text-right font-bold tracking-wider text-md leading-4'>{round.result.join('')}</span>
                </div>
              );
            })}
            {rounds.length === 0 && (
              <div className='col-span-8 px-3 py-2 text-sm text-muted-foreground border rounded-md'>
                No rounds yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function renderPlacement(placement: TournamentPlacement) {
  switch (placement) {
    case 'champion':
      return 'Champion';
    case 'finalist':
      return 'Finalist';
    case 't4':
      return 'Top 4';
    case 't8':
      return 'Top 8';
    case 't16':
      return 'Top 16';
    case 't32':
      return 'Top 32';
    case 't64':
      return 'Top 64';
    case 't128':
      return 'Top 128';
    case 't256':
      return 'Top 256';
    case 't512':
      return 'Top 512';
    case 't1024':
      return 'Top 1024';
    case 'dropped':
      return 'Dropped';
    case 'no placement':
      return 'No placement';
  }
}
