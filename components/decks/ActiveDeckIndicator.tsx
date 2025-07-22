'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

interface ActiveDeck {
  id: string;
  name: string;
  format: string;
  pokemon_count: number;
  trainer_count: number;
  energy_count: number;
}

interface ActiveDeckIndicatorProps {
  userId: string;
}

export function ActiveDeckIndicator({ userId }: ActiveDeckIndicatorProps) {
  const [activeDeck, setActiveDeck] = useState<ActiveDeck | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadActiveDeck();
  }, [userId]);

  const loadActiveDeck = async () => {
    try {
      const { data, error } = await supabase
        .from('decks')
        .select('id, name, format, pokemon_count, trainer_count, energy_count')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Failed to load active deck:', error);
      }
      
      setActiveDeck(data);
    } catch (error) {
      console.error('Failed to load active deck:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !activeDeck) {
    return null;
  }

  const totalCards = activeDeck.pokemon_count + activeDeck.trainer_count + activeDeck.energy_count;

  return (
    <Card className="p-4 bg-accent/50 border-green-600/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-sm font-medium">Active Deck</p>
            <p className="text-lg font-semibold">{activeDeck.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={activeDeck.format === 'Standard' ? 'default' : 'secondary'}>
            {activeDeck.format}
          </Badge>
          <Badge variant="outline">{totalCards} cards</Badge>
        </div>
      </div>
    </Card>
  );
}