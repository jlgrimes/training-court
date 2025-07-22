'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle } from 'lucide-react';

interface DeckViewerDialogProps {
  open: boolean;
  onClose: () => void;
  deck: {
    id: string;
    name: string;
    format: string;
    pokemon_count: number;
    trainer_count: number;
    energy_count: number;
    is_active: boolean;
    list: Array<{
      card: any;
      count: number;
    }>;
  } | null;
}

export function DeckViewerDialog({ open, onClose, deck }: DeckViewerDialogProps) {
  if (!deck) return null;

  const pokemonCards = deck.list.filter(({ card }) => card.supertype === 'Pokémon');
  const trainerCards = deck.list.filter(({ card }) => card.supertype === 'Trainer');
  const energyCards = deck.list.filter(({ card }) => card.supertype === 'Energy');

  const renderCardList = (cards: Array<{ card: any; count: number }>, type: string) => (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm text-muted-foreground mb-2">
        {type} ({cards.reduce((sum, { count }) => sum + count, 0)})
      </h3>
      {cards.map(({ card, count }, index) => (
        <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">{count}x</span>
            <span className="text-sm">{card.name}</span>
            {card.set && (
              <Badge variant="outline" className="text-xs">
                {card.set.id.toUpperCase()} {card.number}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{deck.name}</DialogTitle>
            <div className="flex items-center space-x-2">
              <Badge variant={deck.format === 'Standard' ? 'default' : 'secondary'}>
                {deck.format}
              </Badge>
              {deck.is_active && (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4 mt-4">
          <div className="space-y-6">
            {pokemonCards.length > 0 && renderCardList(pokemonCards, 'Pokémon')}
            {trainerCards.length > 0 && renderCardList(trainerCards, 'Trainer')}
            {energyCards.length > 0 && renderCardList(energyCards, 'Energy')}
          </div>
        </ScrollArea>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}