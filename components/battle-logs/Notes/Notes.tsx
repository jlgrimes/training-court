'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/utils/supabase/client';
import { EditIcon, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { T, useGT } from 'gt-react';

interface NotesProps {
  logId: string;
  serverLoadedNotes: string | null;
}

export const Notes = ({ logId, serverLoadedNotes }: NotesProps) => {
  const gt = useGT();
  const [savedNotes, setSavedNotes] = useState(serverLoadedNotes ?? '');
  const [draft, setDraft] = useState(serverLoadedNotes ?? '');
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    setSavedNotes(serverLoadedNotes ?? '');
    setDraft(serverLoadedNotes ?? '');
    setSaveError(false);
  }, [logId, serverLoadedNotes]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(false);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('logs').update({ notes: draft }).eq('id', logId);
      if (error) throw error;
      setSavedNotes(draft);
      setIsEditing(false);
    } catch {
      setSaveError(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => {
      if (isSaving) return;
      setOpen(nextOpen);
      setDraft(savedNotes);
      setIsEditing(!savedNotes.trim());
      setSaveError(false);
    }}>
      <Dialog.Trigger asChild>
        <button type="button" className="flex w-full min-w-0 items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={gt('Open notes', { $id: 'battleLogs.notes.open' })}>
          <span className="shrink-0 font-medium"><T id="battleLogs.notes.title">Notes</T></span>
          <span className="min-w-0 flex-1 truncate text-muted-foreground">
            {savedNotes.trim() ? savedNotes.replace(/\s+/g, ' ').trim() : <T id="battleLogs.notes.add">Add a note</T>}
          </span>
          <EditIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm" />
        <Dialog.Content aria-describedby={undefined} className="fixed left-1/2 top-1/2 z-[61] w-[calc(100vw-2rem)] max-w-xl max-h-[calc(100dvh-3rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-background p-6 shadow-xl">
          <Dialog.Title className="mb-4 pr-8 text-lg font-semibold"><T id="battleLogs.notes.title">Notes</T></Dialog.Title>
          {isEditing ? (
            <>
              <Textarea autoFocus rows={8} maxLength={500} value={draft} disabled={isSaving}
                aria-label={gt('Notes', { $id: 'battleLogs.notes.title' })}
                onChange={(event) => setDraft(event.target.value)} />
              {saveError && <p role="alert" className="mt-3 text-sm text-destructive"><T id="battleLogs.notes.saveError">Could not save notes. Please try again.</T></p>}
              <div className="mt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" disabled={isSaving} onClick={() => {
                  setDraft(savedNotes); setIsEditing(false); setSaveError(false);
                  if (!savedNotes.trim()) setOpen(false);
                }}><T id="common.cancel">Cancel</T></Button>
                <Button type="button" disabled={isSaving} onClick={handleSave}>
                  {isSaving ? <T id="battleLogs.notes.saving">Saving...</T> : <T id="battleLogs.notes.save">Save</T>}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="whitespace-pre-wrap break-words text-sm">{savedNotes}</p>
              <div className="mt-4 flex justify-end">
                <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <EditIcon className="mr-2 h-4 w-4" /><T id="battleLogs.notes.edit">Edit notes</T>
                </Button>
              </div>
            </>
          )}
          <Dialog.Close disabled={isSaving} className="absolute right-4 top-4 rounded p-1 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={gt('Close', { $id: 'common.close' })}>
            <X className="h-4 w-4" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
