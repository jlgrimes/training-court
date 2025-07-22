import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface DeckImportLoadingProps {
  open: boolean;
  status: string;
  progress?: number;
}

export function DeckImportLoading({ open, status, progress }: DeckImportLoadingProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="max-w-sm" hideCloseButton>
        <div className="flex flex-col items-center justify-center space-y-4 py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">Importing Deck</p>
            <p className="text-xs text-muted-foreground">{status}</p>
          </div>
          {progress !== undefined && (
            <Progress value={progress} className="w-full" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}