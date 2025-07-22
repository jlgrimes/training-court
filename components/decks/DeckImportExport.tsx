'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Upload, Copy, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/utils/supabase/client';

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

interface DeckImportExportProps {
  open: boolean;
  onClose: () => void;
  onSave: (deck: Deck) => void;
  editingDeck?: Deck | null;
  userId: string;
}

export function DeckImportExport({ open, onClose, onSave, editingDeck, userId }: DeckImportExportProps) {
  const [importText, setImportText] = useState('');
  const [deckName, setDeckName] = useState('');
  const [format, setFormat] = useState<'Standard' | 'Expanded'>('Standard');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    if (editingDeck) {
      // Export mode - generate deck list
      generateExportText(editingDeck);
    } else {
      // Import mode - clear fields
      setImportText('');
      setDeckName('');
      setFormat('Standard');
    }
  }, [editingDeck, open]);

  const generateExportText = (deck: Deck) => {
    const lines: string[] = [];
    
    if (deck.list && deck.list.cards) {
      // Pokemon
      const pokemon = deck.list.cards.filter((dc: any) => dc.card.supertype === 'Pokémon');
      if (pokemon.length > 0) {
        lines.push(`Pokémon - ${deck.pokemon_count}`);
        pokemon.forEach((dc: any) => {
          lines.push(`${dc.count} ${dc.card.name} ${dc.card.set.id} ${dc.card.number}`);
        });
        lines.push('');
      }

      // Trainers
      const trainers = deck.list.cards.filter((dc: any) => dc.card.supertype === 'Trainer');
      if (trainers.length > 0) {
        lines.push(`Trainer - ${deck.trainer_count}`);
        trainers.forEach((dc: any) => {
          lines.push(`${dc.count} ${dc.card.name} ${dc.card.set.id} ${dc.card.number}`);
        });
        lines.push('');
      }

      // Energy
      const energy = deck.list.cards.filter((dc: any) => dc.card.supertype === 'Energy');
      if (energy.length > 0) {
        lines.push(`Energy - ${deck.energy_count}`);
        energy.forEach((dc: any) => {
          lines.push(`${dc.count} ${dc.card.name} ${dc.card.set.id} ${dc.card.number}`);
        });
        lines.push('');
      }

      lines.push(`Total Cards - ${deck.pokemon_count + deck.trainer_count + deck.energy_count}`);
    } else {
      // Fallback for decks without detailed card data
      lines.push(`Deck: ${deck.name}`);
      lines.push(`Format: ${deck.format}`);
      lines.push(`Pokemon: ${deck.pokemon_count}`);
      lines.push(`Trainers: ${deck.trainer_count}`);
      lines.push(`Energy: ${deck.energy_count}`);
      lines.push(`Total: ${deck.pokemon_count + deck.trainer_count + deck.energy_count}`);
    }

    setImportText(lines.join('\n'));
  };

  const parseDeckList = (text: string) => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    
    let pokemonCount = 0;
    let trainerCount = 0;
    let energyCount = 0;
    let currentSection = '';
    const cards: any[] = [];

    for (const line of lines) {
      // Section headers
      if (line.startsWith('Pokémon -')) {
        currentSection = 'pokemon';
        continue;
      } else if (line.startsWith('Trainer -')) {
        currentSection = 'trainer';
        continue;
      } else if (line.startsWith('Energy -')) {
        currentSection = 'energy';
        continue;
      } else if (line.startsWith('Total Cards') || line === '') {
        continue;
      }

      // Card lines
      const match = line.match(/^(\d+)\s+(.+?)(?:\s+([A-Z0-9-]+)\s+(\d+))?$/);
      if (match) {
        const [_, count, name, setId, number] = match;
        const cardCount = parseInt(count);
        
        // Simple card object without API lookup
        const card = {
          id: `${name}-${setId || 'unknown'}-${number || '0'}`,
          name: name.trim(),
          supertype: currentSection === 'pokemon' ? 'Pokémon' : 
                      currentSection === 'trainer' ? 'Trainer' : 'Energy',
          set: { id: setId || 'unknown' },
          number: number || '0',
          images: { small: '', large: '' }
        };

        cards.push({ card, count: cardCount });

        if (currentSection === 'pokemon') pokemonCount += cardCount;
        else if (currentSection === 'trainer') trainerCount += cardCount;
        else if (currentSection === 'energy') energyCount += cardCount;
      }
    }

    return {
      cards,
      pokemonCount,
      trainerCount,
      energyCount,
      totalCount: pokemonCount + trainerCount + energyCount
    };
  };

  const handleImport = async () => {
    if (!importText.trim()) {
      toast({
        title: 'Error',
        description: 'Please paste a deck list to import',
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

    setLoading(true);
    try {
      const parsed = parseDeckList(importText);
      
      if (parsed.totalCount !== 60) {
        toast({
          title: 'Warning',
          description: `Deck contains ${parsed.totalCount} cards instead of 60`,
          variant: 'destructive',
        });
      }

      const deckData = {
        user_id: userId,
        name: deckName,
        format,
        list: { cards: parsed.cards },
        pokemon_count: parsed.pokemonCount,
        trainer_count: parsed.trainerCount,
        energy_count: parsed.energyCount,
        is_active: false,
      };

      const { data, error } = await supabase
        .from('decks')
        .insert(deckData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Deck imported successfully',
      });
      
      onSave(data);
      onClose();
    } catch (error: any) {
      console.error('Failed to import deck:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      let errorMessage = 'Failed to import deck.';
      if (error.code === '42P01') {
        errorMessage = 'Decks table not found. Please contact support to set up the database.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(importText);
      setCopied(true);
      toast({
        title: 'Success',
        description: 'Deck list copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingDeck ? 'Export Deck' : 'Import Deck'}</DialogTitle>
          <DialogDescription>
            {editingDeck 
              ? 'Copy the deck list below to share or save it.'
              : 'Paste a deck list in PTCGO format to import it.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!editingDeck && (
            <>
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
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="deck-list">Deck List</Label>
            <Textarea
              id="deck-list"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={editingDeck ? '' : 'Paste your deck list here...\n\nExample:\nPokémon - 12\n4 Pikachu BRS 52\n2 Raichu BRS 53\n...\n\nTrainer - 36\n4 Professor\'s Research BRS 147\n...\n\nEnergy - 12\n12 Lightning Energy 4'}
              rows={15}
              readOnly={!!editingDeck}
              className={editingDeck ? 'font-mono text-sm' : ''}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {editingDeck ? (
            <Button onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </Button>
          ) : (
            <Button onClick={handleImport} disabled={loading}>
              <Upload className="h-4 w-4 mr-2" />
              {loading ? 'Importing...' : 'Import Deck'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}