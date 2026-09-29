'use client';

import * as React from 'react';
import { useCallback, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { POCKET_TOURNAMENT_CONFIG } from '@/components/tournaments/utils/tournament-game-config';
import type { ImportPocketTournamentResponse } from '@/app/api/pocket/tournaments/import/route';

export default function PocketTournamentImport({ userId }: { userId: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = useCallback(async () => {
    if (!url.trim()) return;
    setIsImporting(true);

    try {
      const res = await fetch('/api/pocket/tournaments/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = (await res.json()) as
        | ImportPocketTournamentResponse
        | { message?: string };

      if (!res.ok || !('rounds' in data)) {
        throw new Error(
          ('message' in data && data.message) || 'Failed to import tournament.'
        );
      }

      const supabase = createClient();

      const { data: created, error: tournamentError } = await supabase
        .from(POCKET_TOURNAMENT_CONFIG.tournamentsTable)
        .insert({
          name: data.tournament.name,
          date_from: data.tournament.date,
          date_to: data.tournament.date,
          user: userId,
          format: data.tournament.format,
          placement: data.tournament.placement,
          deck: data.tournament.deck,
          notes: null,
        })
        .select('id')
        .returns<{ id: string }[]>();

      if (tournamentError || !created?.[0]) {
        throw new Error(tournamentError?.message ?? 'Failed to create tournament.');
      }

      const tournamentId = created[0].id;

      const roundsPayload = data.rounds.map((round) => ({
        tournament: tournamentId,
        round_num: round.round_num,
        result: round.result,
        deck: round.deck,
        match_end_reason: round.match_end_reason,
        turn_orders: round.turn_orders,
        user: userId,
      }));

      const { error: roundsError } = await supabase
        .from(POCKET_TOURNAMENT_CONFIG.roundsTable)
        .insert(roundsPayload);

      if (roundsError) {
        throw new Error(roundsError.message);
      }

      if (data.unmatchedDecks > 0) {
        toast({
          title: 'Tournament imported',
          description: `Imported ${data.rounds.length} rounds. We couldn’t match ${data.unmatchedDecks} opponent deck${data.unmatchedDecks === 1 ? '' : 's'} — you can add those manually.`,
        });
      }

      setOpen(false);
      setUrl('');
      window.location.href = `${POCKET_TOURNAMENT_CONFIG.basePath}/${tournamentId}`;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description:
          error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    } finally {
      setIsImporting(false);
    }
  }, [url, userId, toast]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setUrl('');
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Import from Limitless
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[min(92vw,560px)] p-0 overflow-hidden sm:rounded-2xl">
        <div className="p-4 sm:p-6">
          <DialogHeader className="pb-2">
            <DialogTitle>Import from Limitless</DialogTitle>
            <DialogDescription>
              Paste a Limitless tournament link for your player page and we’ll
              import the tournament, your matchups, and results.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Input
              className="w-full"
              placeholder="https://play.limitlesstcg.com/tournament/.../player/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && url.trim() && !isImporting) {
                  handleImport();
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Tip: open your own player page on Limitless and copy that URL — it
              should end with <span className="font-mono">/player/your-name</span>.
            </p>
          </div>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isImporting}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleImport} disabled={isImporting || !url.trim()}>
              {isImporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Import tournament'
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
