'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';

interface Deck {
  id: string;
  name: string;
  format: 'Standard' | 'Expanded';
  pokemon_count: number;
  trainer_count: number;
  energy_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  list?: any;
}

interface DeckViewerProps {
  open: boolean;
  onClose: () => void;
  deck: Deck | null;
}

export function DeckViewer({ open, onClose, deck }: DeckViewerProps) {
  if (!deck) return null;

  const renderCardList = (cards: any[], type: string) => {
    const sortedCards = [...cards].sort((a, b) => {
      // Sort by count (descending) then by name
      if (b.count !== a.count) return b.count - a.count;
      return a.card.name.localeCompare(b.card.name);
    });

    return (
      <div className="space-y-1">
        {sortedCards.map((dc, index) => (
          <div key={`${dc.card.id}-${index}`} className="flex items-center justify-between py-1 px-2 hover:bg-muted/50 rounded">
            <div className="flex items-center gap-2">
              <span className="font-semibold w-6 text-right">{dc.count}</span>
              <span>{dc.card.name}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {dc.card.set.id !== 'unknown' && dc.card.set.id !== 'energy' && (
                <>{dc.card.set.id} {dc.card.number}</>
              )}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const pokemonCards = deck.list?.cards?.filter((dc: any) => dc.card.supertype === 'Pokémon') || [];
  const trainerCards = deck.list?.cards?.filter((dc: any) => dc.card.supertype === 'Trainer') || [];
  const energyCards = deck.list?.cards?.filter((dc: any) => dc.card.supertype === 'Energy') || [];

  const totalCards = deck.pokemon_count + deck.trainer_count + deck.energy_count;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">{deck.name}</DialogTitle>
            <div className="flex gap-2">
              <Badge variant={deck.format === 'Standard' ? 'default' : 'secondary'}>
                {deck.format}
              </Badge>
              {deck.is_active && (
                <Badge variant="outline" className="border-primary text-primary">
                  Active Deck
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-primary">{deck.pokemon_count}</div>
            <div className="text-sm text-muted-foreground">Pokémon</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-orange-500">{deck.trainer_count}</div>
            <div className="text-sm text-muted-foreground">Trainers</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-yellow-500">{deck.energy_count}</div>
            <div className="text-sm text-muted-foreground">Energy</div>
          </Card>
        </div>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {/* Pokémon Section */}
            {pokemonCards.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">Pokémon</h3>
                  <Badge variant="outline" className="text-xs">{deck.pokemon_count}</Badge>
                </div>
                {renderCardList(pokemonCards, 'Pokémon')}
              </div>
            )}

            {pokemonCards.length > 0 && trainerCards.length > 0 && <Separator />}

            {/* Trainer Section */}
            {trainerCards.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">Trainers</h3>
                  <Badge variant="outline" className="text-xs">{deck.trainer_count}</Badge>
                </div>
                {renderCardList(trainerCards, 'Trainer')}
              </div>
            )}

            {(pokemonCards.length > 0 || trainerCards.length > 0) && energyCards.length > 0 && <Separator />}

            {/* Energy Section */}
            {energyCards.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">Energy</h3>
                  <Badge variant="outline" className="text-xs">{deck.energy_count}</Badge>
                </div>
                {renderCardList(energyCards, 'Energy')}
              </div>
            )}

            {/* Total */}
            <Separator />
            <div className="flex items-center justify-between font-semibold">
              <span>Total Cards</span>
              <span className={totalCards === 60 ? 'text-green-600' : 'text-red-600'}>
                {totalCards}/60
              </span>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}