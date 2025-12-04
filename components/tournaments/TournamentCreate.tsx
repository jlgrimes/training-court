'use client';

import * as React from 'react';
import { useCallback, useState } from 'react';
import { Plus, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { DateRange } from 'react-day-picker';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  TournamentCategory,
  allTournamentCategories,
  displayTournamentCategory,
} from './Category/tournament-category.types';
import { TournamentCategoryIcon } from './Category/TournamentCategoryIcon';
import { TournamentPlacement } from './Placement/tournament-placement.types';
import { TournamentPlacementSelect } from './Placement/TournamentPlacementSelect';
import { tournamentFormats } from './Format/tournament-format.types';
import { Database } from '@/database.types';
import { TournamentGameConfig } from './utils/tournament-game-config';

function toUtcNoon(date: Date | null | undefined): Date | null {
  if (!date) return null;
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  return new Date(Date.UTC(y, m, d, 12, 0, 0, 0));
}

export default function TournamentCreateDialog({
  userId,
  config,
}: { userId: string; config: TournamentGameConfig }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const [isCreating, setIsCreating] = useState(false);
  const [tournamentName, setTournamentName] = useState('');
  const [tournamentDate, setTournamentDate] = useState<DateRange | undefined>();
  const [tournamentCategory, setTournamentCategory] = useState<TournamentCategory | null>(null);
  const [tournamentPlacement, setTournamentPlacement] = useState<TournamentPlacement | null>(null);
  const [format, setFormat] = useState<string | null>(null);

  const resetForm = () => {
    setTournamentName('');
    setTournamentDate(undefined);
    setTournamentCategory(null);
    setTournamentPlacement(null);
    setFormat(null);
  };

  const handleAddTournament = useCallback(async () => {
    if (!tournamentDate?.from) return;

    setIsCreating(true);
    const supabase = createClient();

    const dateFromUTC = toUtcNoon(tournamentDate.from);
    const dateToUTC = toUtcNoon(tournamentDate.to ?? tournamentDate.from);

    const { data, error } = await supabase
      .from(config.tournamentsTable)
      .insert({
        name: tournamentName,
        date_from: dateFromUTC?.toISOString(),
        date_to: dateToUTC?.toISOString(),
        user: userId,
        category: tournamentCategory,
        placement: tournamentPlacement,
        format: format,
      })
      .select()
      .returns<Database['public']['Tables']['tournaments']['Row'][]>();

    setIsCreating(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: error.message,
      });
      return;
    }

    setOpen(false);
    resetForm();
    window.location.href = `${config.basePath}/${data![0].id}`;
  }, [tournamentName, tournamentDate, tournamentCategory, tournamentPlacement, format, userId, toast, config.basePath, config.tournamentsTable]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Tournament
        </Button>
      </DialogTrigger>

      <DialogContent
        className="
          w-[min(92vw,560px)]
          p-0
          overflow-hidden
          sm:rounded-2xl
        "
      >
        <div className="p-4 sm:p-6">
          <DialogHeader className="pb-2">
            <DialogTitle>Create tournament</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              className="w-full"
              placeholder="Tournament name"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
            />

            <div className="w-full">
              <DatePicker date={tournamentDate} setDate={setTournamentDate} />
            </div>

            <Select
              value={tournamentCategory ?? undefined}
              onValueChange={(val) => setTournamentCategory(val as TournamentCategory)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select tournament category" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {allTournamentCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    <div className="flex items-center gap-2">
                      <TournamentCategoryIcon category={cat} />
                      <p>{displayTournamentCategory(cat)}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={format ?? undefined}
              onValueChange={(val) => setFormat(val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {(config.formats?.length ? config.formats : tournamentFormats).map((fmt) => (
                  <SelectItem key={fmt} value={fmt}>
                    {fmt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <TournamentPlacementSelect
              value={tournamentPlacement}
              onChange={(p: TournamentPlacement) => setTournamentPlacement(p)}
            />
          </div>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isCreating}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleAddTournament}
              disabled={isCreating || !tournamentName || !tournamentDate?.from}
            >
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Add tournament'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
