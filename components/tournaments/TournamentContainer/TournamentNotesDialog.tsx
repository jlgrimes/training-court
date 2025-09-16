import { NotepadText } from 'lucide-react';
import { Button } from "../../ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

interface TournamentNotesDialogProps {
  tournamentId: string;
}

export const TournamentNotesDialog = (props: TournamentNotesDialogProps) => {
    const { toast } = useToast();

    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // if (!next) resetLocal();
      }}
    >
      <DialogTrigger asChild>
        <Button variant='ghost' size='icon' className="w-8 h-8"><NotepadText className="h-4 w-4" color="gray" /></Button>
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
              value={props.tournamentId}
            //   onChange={(e) => setTournamentName(e.target.value)}
            />
          </div>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={saving}>
                Cancel
              </Button>
            </DialogClose>
            {/* <Button
              onClick={handleUpdateTournament}
              disabled={saving || !tournamentName || !tournamentDate?.from}
            >
              {saving ? "Saving..." : "Save changes"}
            </Button> */}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}