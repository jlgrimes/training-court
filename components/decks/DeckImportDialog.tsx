'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface DeckImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (deckName: string, format: 'Standard' | 'Expanded', deckList: string) => void;
}

export function DeckImportDialog({ open, onClose, onImport }: DeckImportDialogProps) {
  const [deckList, setDeckList] = useState('');
  const [deckName, setDeckName] = useState('');
  const [format, setFormat] = useState<'Standard' | 'Expanded'>('Standard');
  const { toast } = useToast();

  const handleImport = () => {
    if (!deckList.trim()) {
      toast({
        title: 'Error',
        description: 'Please paste a deck list',
        variant: 'destructive',
      });
      return;
    }

    if (!deckName.trim()) {
      toast({
        title: 'Error', 
        description: 'Please enter a deck name',
        variant: 'destructive',
      });
      return;
    }

    // Pass the data to parent component
    onImport(deckName, format, deckList);
    
    // Reset form
    setDeckList('');
    setDeckName('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Deck</DialogTitle>
          <DialogDescription>
            Paste your deck list below. Supports PTCGO and PTCGL formats.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deck-name">Deck Name</Label>
            <Input
              id="deck-name"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="Enter deck name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="format">Format</Label>
            <Select value={format} onValueChange={(value) => setFormat(value as 'Standard' | 'Expanded')}>
              <SelectTrigger id="format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Standard">Standard</SelectItem>
                <SelectItem value="Expanded">Expanded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deck-list">Deck List</Label>
            <Textarea
              id="deck-list"
              value={deckList}
              onChange={(e) => setDeckList(e.target.value)}
              placeholder={`Paste your deck list here...

Example format:

Pokémon: 13
4 Pikachu BRS 52
2 Raichu BRS 53
...

Trainer: 35
4 Professor's Research BRS 147
...

Energy: 12
4 Basic {L} Energy
8 Basic {R} Energy`}
              rows={15}
              className="font-mono text-sm"
            />
          </div>

        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleImport}>
            Import Deck
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}