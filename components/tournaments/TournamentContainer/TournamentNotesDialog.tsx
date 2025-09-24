'use client';

import { useEffect, useState } from 'react';
import { SerializedEditorState } from 'lexical';
import { NotepadText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Editor } from '@/components/blocks/editor-00/editor';
import { createClient } from '@/utils/supabase/client';

export async function loadTournamentNotes(tournamentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tournaments')
    .select('notes')
    .eq('id', tournamentId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function saveTournamentNotes(tournamentId: string, content: unknown) {
  const supabase = createClient();
   const { error } = await supabase
    .from('tournaments')
    .update({ notes: content })
    .eq('id', tournamentId)
    .select('id')
    .maybeSingle();

  if (error) throw error;
}


interface TournamentNotesDialogProps {
  tournamentId: string;
  tournamentNotes: string | null;
  tournamentName: string;
}

const EMPTY_EDITOR_STATE = {
  root: {
    type: 'root',
    version: 1,
    indent: 0,
    format: '',
    direction: 'ltr',
    children: [
      { type: 'paragraph', version: 1, indent: 0, format: '', direction: 'ltr', children: [] },
    ],
  },
} as unknown as SerializedEditorState;

function toLexicalState(raw: unknown): SerializedEditorState {
  try {
    if (!raw) return EMPTY_EDITOR_STATE;
    if (typeof raw === 'string') return JSON.parse(raw) as SerializedEditorState;
    return raw as SerializedEditorState;
  } catch {
    return EMPTY_EDITOR_STATE;
  }
}

export function TournamentNotesDialog({
  tournamentId,
  tournamentNotes,
  tournamentName
}: TournamentNotesDialogProps) {
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editorState, setEditorState] = useState<SerializedEditorState>(EMPTY_EDITOR_STATE);

   useEffect(() => {
    if (!open) return;
    const next = toLexicalState(tournamentNotes);
    setEditorState(next);
  }, [open, tournamentNotes]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveTournamentNotes(tournamentId, editorState);
      toast({ title: 'Note saved' });
      setOpen(false);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Save failed', description: e?.message ?? String(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="w-8 h-8" aria-label="Open notes">
          <NotepadText className="h-4 w-4" color="gray" />
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[min(92vw,720px)] p-0 overflow-hidden sm:rounded-2xl">
        <div className="p-4 sm:p-6">
          <DialogHeader className="pb-2">
            <DialogTitle>{tournamentName} Notes</DialogTitle>
          </DialogHeader>

          {/* Editor area */}
          <div className="mt-2">
            <div className="border rounded-md p-2 h-[50vh] overflow-auto">
              <Editor
                editorSerializedState={editorState}
                onSerializedChange={(next) => setEditorState(next)}
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={saving}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
