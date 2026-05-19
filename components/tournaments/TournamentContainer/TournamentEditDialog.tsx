'use client';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCallback, useEffect, useState } from "react";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "../../ui/use-toast";
import { Pencil } from "lucide-react";
import { DateRange } from "react-day-picker";
import { DatePicker } from "@/components/ui/date-picker";
import {
  TournamentCategory,
  allTournamentCategories,
  displayTournamentCategory,
} from "../Category/tournament-category.types";
import { TournamentCategoryIcon } from "../Category/TournamentCategoryIcon";
import { TournamentPlacement } from "../Placement/tournament-placement.types";
import { TournamentPlacementSelect } from "../Placement/TournamentPlacementSelect";
import { tournamentFormats } from "../Format/tournament-format.types";
import { PTCG_TOURNAMENT_CONFIG, TournamentGameConfig } from "../utils/tournament-game-config";
import { DecklistSelect } from "@/components/ptcg/deckbuilder/DecklistSelect";
import { Database } from "@/database.types";

/** Normalize to 12:00:00Z to avoid TZ/DST off-by-one */
function toUtcNoon(date: Date | null | undefined): Date | null {
  if (!date) return null;
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  return new Date(Date.UTC(y, m, d, 12, 0, 0, 0));
}

interface TournamentEditDialogProps {
  tournamentId: string;
  tournamentName: string;
  tournamentCategory: TournamentCategory | null;
  tournamentPlacement: TournamentPlacement | null;
  tournamentDateRange: DateRange;
  tournamentFormat: string | null;
  tournamentDeck: string | null;
  tournamentDecklistId: string | null;
  user: User | null;
  updateClientTournament: (
    newName: string,
    newDateRange: DateRange,
    newCategory: TournamentCategory | null,
    newPlacement: TournamentPlacement | null,
    newFormat: string | null,
    newDeck: string | null,
    newDecklistId: string | null
  ) => void;
  config?: TournamentGameConfig;
  formats?: string[];
}

export const TournamentEditDialog = (props: TournamentEditDialogProps) => {
  const { toast } = useToast();
  const config = props.config ?? PTCG_TOURNAMENT_CONFIG;

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [tournamentName, setTournamentName] = useState('');
  const [tournamentDate, setTournamentDate] = useState<DateRange | undefined>();
  const [tournamentCategory, setTournamentCategory] = useState<TournamentCategory | null>(null);
  const [tournamentPlacement, setTournamentPlacement] = useState<TournamentPlacement | null>(null);
  const [tournamentFormat, setTournamentFormat] = useState<string | null>(null);
  const [decklist, setDecklist] = useState<Pick<Database['public']['Tables']['decklists']['Row'], 'archetype' | 'id' | 'name'> | null>(null);

  // seed local state when dialog opens or props change
  useEffect(() => setTournamentName(props.tournamentName), [props.tournamentName]);
  useEffect(() => setTournamentDate(props.tournamentDateRange), [props.tournamentDateRange]);
  useEffect(() => setTournamentCategory(props.tournamentCategory), [props.tournamentCategory]);
  useEffect(() => setTournamentPlacement(props.tournamentPlacement), [props.tournamentPlacement]);
  useEffect(() => setTournamentFormat(props.tournamentFormat), [props.tournamentFormat]);
  useEffect(() => {
    setDecklist(
      props.tournamentDecklistId
        ? {
            id: props.tournamentDecklistId,
            name: props.tournamentDeck ?? 'Selected decklist',
            archetype: props.tournamentDeck,
          }
        : null
    );
  }, [props.tournamentDeck, props.tournamentDecklistId]);

  const handleUpdateTournament = useCallback(async () => {
    if (!tournamentDate?.from) return;

    // optimistic update
    const prev = {
      name: props.tournamentName,
      date: props.tournamentDateRange,
      category: props.tournamentCategory,
      placement: props.tournamentPlacement,
      format: props.tournamentFormat,
      deck: props.tournamentDeck,
      decklistId: props.tournamentDecklistId,
    };
    const nextDeck = decklist ? decklist.archetype ?? decklist.name : null;
    const nextDecklistId = decklist?.id ?? null;
    props.updateClientTournament(
      tournamentName,
      tournamentDate as DateRange,
      tournamentCategory,
      tournamentPlacement,
      tournamentFormat,
      nextDeck,
      nextDecklistId
    );

    setSaving(true);
    const supabase = createClient();

    const fromNoonUTC = toUtcNoon(tournamentDate.from);
    const toNoonUTC = toUtcNoon(tournamentDate.to ?? tournamentDate.from);

    const { error } = await supabase
      .from(config.tournamentsTable)
      .update({
        name: tournamentName,
        date_from: fromNoonUTC?.toISOString(),
        date_to: toNoonUTC?.toISOString(),
        category: tournamentCategory,
        placement: tournamentPlacement,
        format: tournamentFormat,
        ...(config.gameId === 'pokemon-tcg'
          ? {
              deck: nextDeck,
              decklist_id: nextDecklistId,
            }
          : {}),
      })
      .eq('id', props.tournamentId);

    setSaving(false);

    if (error) {
      // rollback on failure
      props.updateClientTournament(
        prev.name,
        prev.date,
        prev.category,
        prev.placement,
        prev.format,
        prev.deck,
        prev.decklistId
      );
      toast({
        variant: "destructive",
        title: "Couldn’t save changes",
        description: error.message,
      });
      return;
    }

    toast({ title: "Tournament changes saved." });
    setOpen(false);
  }, [
    tournamentName,
    tournamentDate,
    tournamentCategory,
    tournamentPlacement,
    tournamentFormat,
    decklist,
    props.tournamentId,
    props.updateClientTournament,
    props.tournamentName,
    props.tournamentDateRange,
    props.tournamentCategory,
    props.tournamentPlacement,
    props.tournamentFormat,
    props.tournamentDeck,
    props.tournamentDecklistId,
    toast,
    config.tournamentsTable,
    config.gameId,
  ]);

  const resetLocal = () => {
    setTournamentName(props.tournamentName);
    setTournamentDate(props.tournamentDateRange);
    setTournamentCategory(props.tournamentCategory);
    setTournamentPlacement(props.tournamentPlacement);
    setTournamentFormat(props.tournamentFormat);
    setDecklist(
      props.tournamentDecklistId
        ? {
            id: props.tournamentDecklistId,
            name: props.tournamentDeck ?? 'Selected decklist',
            archetype: props.tournamentDeck,
          }
        : null
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetLocal();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="w-8 h-8">
          <Pencil className="h-4 w-4" color="gray" />
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
            <DialogTitle>Edit tournament</DialogTitle>
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
              onValueChange={(v) => setTournamentCategory(v as TournamentCategory)}
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
              value={tournamentFormat ?? undefined}
              onValueChange={(v) => setTournamentFormat(v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {(props.formats ?? tournamentFormats).map((fmt) => (
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

            {config.gameId === 'pokemon-tcg' && props.user?.id && (
              <DecklistSelect
                userId={props.user.id}
                value={decklist?.id ?? null}
                onChange={setDecklist}
              />
            )}
          </div>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={saving}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleUpdateTournament}
              disabled={saving || !tournamentName || !tournamentDate?.from}
            >
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
