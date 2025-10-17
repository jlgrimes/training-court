'use client';

import { useEffect, useRef, useState } from 'react';
import { NotepadText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogClose, DialogContent, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/utils/supabase/client';

interface TournamentNotesDialogProps {
  tournamentId: string;
  tournamentName: string;
  tournamentNotes: string | null;
}

async function loadNotes(tournamentId: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tournaments')
    .select('notes')
    .eq('id', tournamentId)
    .maybeSingle();
  if (error) throw error;
  return (data?.notes ?? '') as string;
}

async function saveNotes(tournamentId: string, notes: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('tournaments')
    .update({ notes })
    .eq('id', tournamentId);
  if (error) throw error;
}

export function TournamentNotesDialog({
  tournamentId,
  tournamentName,
  tournamentNotes,
}: TournamentNotesDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const [text, setText] = useState<string>(tournamentNotes ?? '');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Tiny autosave: save after 1.2s of inactivity when open
  const autosaveTimer = useRef<number | null>(null);
  const dirtyRef = useRef(false);

  // Always fetch the freshest notes when dialog opens
  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const latest = await loadNotes(tournamentId);
        if (!alive) return;
        setText(latest);
      } catch (e: any) {
        toast({
          variant: 'destructive',
          title: 'Failed to load notes',
          description: e?.message ?? String(e),
        });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, tournamentId, toast]);

  useEffect(() => {
    if (!open) return;
    if (!dirtyRef.current) return;

    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(async () => {
      try {
        setSaving(true);
        await saveNotes(tournamentId, text);
        dirtyRef.current = false;
      } catch (e: any) {
        toast({
          variant: 'destructive',
          title: 'Autosave failed',
          description: e?.message ?? String(e),
        });
      } finally {
        setSaving(false);
      }
    }, 1200) as unknown as number;

    return () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    };
  }, [text, open, tournamentId, toast]);

  const onManualSave = async () => {
    try {
      setSaving(true);
      await saveNotes(tournamentId, text);
      dirtyRef.current = false;
      toast({ title: 'Notes saved' });
      setOpen(false);
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: e?.message ?? String(e),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="w-8 h-8" aria-label="Open notes">
          <NotepadText className="h-4 w-4" color="gray"/>
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[min(92vw,720px)] sm:rounded-2xl">
        <DialogHeader className="pb-1">
          <DialogTitle>{tournamentName} Notes</DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          <Textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              dirtyRef.current = true;
            }}
            placeholder="Start typing… (Markdown is supported)"
            className="min-h-[55vh] resize-vertical"
            disabled={loading}
          />
         <div className="mt-2 text-xs text-muted-foreground h-4">
          {loading
            ? 'Loading…'
            : dirtyRef.current
            ? 'Unsaved changes'
            : 'All changes saved'}
        </div>
        </div>

        <DialogFooter className="mt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={saving}>
              Close
            </Button>
          </DialogClose>
          <Button onClick={onManualSave} disabled={saving || loading}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
