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
    console.log('Parsing deck list:', text);
    const lines = text.trim().split('\n').filter(line => line.trim());
    
    let pokemonCount = 0;
    let trainerCount = 0;
    let energyCount = 0;
    let currentSection = '';
    const cards: any[] = [];
    
    // If no section headers found, try to auto-detect based on common patterns
    const hasHeaders = lines.some(line => 
      line.toLowerCase().includes('pokémon') || 
      line.toLowerCase().includes('pokemon') ||
      line.toLowerCase().includes('trainer') ||
      line.toLowerCase().includes('energy')
    );
    
    if (!hasHeaders) {
      console.log('No section headers found, will auto-detect card types');
      currentSection = 'auto';
    }

    for (const line of lines) {
      console.log('Processing line:', line, 'Current section:', currentSection);
      
      // Section headers - check for various formats
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('pokémon') || lowerLine.includes('pokemon') || 
          (lowerLine.startsWith('##') && lowerLine.includes('pokemon'))) {
        currentSection = 'pokemon';
        console.log('Found Pokemon section');
        continue;
      } else if (lowerLine.includes('trainer') || 
                 (lowerLine.startsWith('##') && lowerLine.includes('trainer'))) {
        currentSection = 'trainer';
        console.log('Found Trainer section');
        continue;
      } else if (lowerLine.includes('energy') || 
                 (lowerLine.startsWith('##') && lowerLine.includes('energy'))) {
        currentSection = 'energy';
        console.log('Found Energy section');
        continue;
      } else if (lowerLine.includes('total cards') || line.trim() === '' || line.startsWith('***')) {
        continue;
      }

      // Card lines - try multiple patterns
      let match = line.match(/^(\d+)\s+(.+?)(?:\s+([A-Z0-9-]+)\s+(\d+))?$/);
      if (!match) {
        // Try simpler pattern for lines like "4 Professor's Research"
        match = line.match(/^(\d+)\s+(.+)$/);
      }
      
      if (match && currentSection) {
        const count = parseInt(match[1]);
        const fullName = match[2];
        const setId = match[3];
        const number = match[4];
        
        // Parse card name and set info if embedded in name
        let cardName = fullName;
        let cardSet = setId;
        let cardNumber = number;
        
        // Check if set info is in the name (e.g., "Pikachu BRS 52")
        const nameSetMatch = fullName.match(/^(.+?)\s+([A-Z]{2,4})\s+(\d+)$/);
        if (nameSetMatch) {
          cardName = nameSetMatch[1];
          cardSet = nameSetMatch[2];
          cardNumber = nameSetMatch[3];
        }
        
        // Special handling for basic energy which often don't have set codes
        const energyMatch = cardName.match(/^(.*?)\s*Energy\s*$/i);
        if (energyMatch && !cardSet) {
          // It's a basic energy without set info
          cardSet = 'energy';
          cardNumber = '1';
        }
        
        // Also handle energy cards with just type (e.g., "Fire", "Water")
        const basicTypes = ['fire', 'water', 'grass', 'lightning', 'psychic', 'fighting', 'darkness', 'metal', 'fairy', 'dragon', 'colorless'];
        if (!cardSet && basicTypes.includes(cardName.toLowerCase())) {
          cardName = cardName + ' Energy';
          cardSet = 'energy';
          cardNumber = '1';
        }
        
        console.log('Parsed card:', { count, cardName, cardSet, cardNumber, section: currentSection });
        
        // Auto-detect card type if no sections
        let supertype = 'Pokémon';
        if (currentSection === 'trainer') {
          supertype = 'Trainer';
        } else if (currentSection === 'energy') {
          supertype = 'Energy';
        } else if (currentSection === 'auto') {
          // Auto-detect based on card name patterns
          const nameLower = cardName.toLowerCase();
          if (nameLower.includes('energy') || nameLower.endsWith(' e')) {
            supertype = 'Energy';
          } else if (
            // Trainer keywords
            nameLower.includes('professor') || nameLower.includes('boss') ||
            nameLower.includes('ball') || nameLower.includes('stadium') ||
            nameLower.includes('tool') || nameLower.includes('supporter') ||
            nameLower.includes('item') || nameLower.includes('switch') ||
            nameLower.includes('research') || nameLower.includes('marnie') ||
            nameLower.includes('catcher') || nameLower.includes('belt') ||
            nameLower.includes('net') || nameLower.includes('radar') ||
            nameLower.includes('court') || nameLower.includes('phone') ||
            nameLower.includes('pad') || nameLower.includes('kit') ||
            nameLower.includes('spray') || nameLower.includes('potion') ||
            nameLower.includes('colress') || nameLower.includes('iono') ||
            nameLower.includes('judge') || nameLower.includes('roxanne') ||
            nameLower.includes('raihan') || nameLower.includes('melony') ||
            nameLower.includes('cheren') || nameLower.includes('hop') ||
            nameLower.includes('sonia') || nameLower.includes('bird keeper') ||
            nameLower.includes('team') || nameLower.includes('poke') ||
            nameLower.includes('training') || nameLower.includes('rescue') ||
            nameLower.includes('scroll') || nameLower.includes('tablet') ||
            nameLower.includes('rope') || nameLower.includes('whistle') ||
            nameLower.includes('cart') || nameLower.includes('order') ||
            nameLower.includes('path') || nameLower.includes('valley') ||
            nameLower.includes('temple') || nameLower.includes('beach') ||
            nameLower.includes('city') || nameLower.includes('tower')
          ) {
            supertype = 'Trainer';
          } else {
            supertype = 'Pokémon';
          }
        } else if (currentSection === 'pokemon') {
          supertype = 'Pokémon';
        }
        
        // Simple card object without API lookup
        const card = {
          id: `${cardName}-${cardSet || 'unknown'}-${cardNumber || '0'}`,
          name: cardName.trim(),
          supertype,
          set: { id: cardSet || 'unknown' },
          number: cardNumber || '0',
          images: { small: '', large: '' }
        };

        cards.push({ card, count });

        // Update counts based on actual card type
        if (supertype === 'Pokémon') pokemonCount += count;
        else if (supertype === 'Trainer') trainerCount += count;
        else if (supertype === 'Energy') energyCount += count;
      } else if (match) {
        console.log('Found card line but no section set yet:', line);
      }
    }

    console.log('Parsing complete:', { 
      totalCards: cards.length,
      pokemonCount, 
      trainerCount, 
      energyCount,
      totalCount: pokemonCount + trainerCount + energyCount,
      cards: cards.map(c => ({
        name: c.card.name,
        count: c.count,
        type: c.card.supertype
      }))
    });
    
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
      
      console.log('Parsed deck data:', parsed);
      
      if (parsed.totalCount === 0) {
        toast({
          title: 'Error',
          description: 'No cards found in the deck list. Please check the format.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
      
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
      
      console.log('Saving deck data:', deckData);

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
              placeholder={editingDeck ? '' : `Paste your deck list here...

Example format:

Pokémon - 12
4 Pikachu BRS 52
2 Raichu BRS 53
3 Charmander MEW 4
3 Charizard ex MEW 54

Trainer - 36
4 Professor's Research BRS 147
4 Quick Ball FST 237
3 Ultra Ball BRS 150
2 Boss's Orders BRS 132

Energy - 12
4 Fire Energy
8 Lightning Energy
or
4 Fire Energy 2
8 Basic Lightning Energy`}
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