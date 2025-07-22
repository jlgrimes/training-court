'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Upload, Trash2, Edit, Download, CheckCircle, Eye } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { DeckImportDialog } from './DeckImportDialog';
import { DeckImportLoading } from './DeckImportLoading';
import { DeckViewerDialog } from './DeckViewerDialog';
import { useToast } from '@/components/ui/use-toast';
import { parseDeckList, fetchCardData } from './deckParser';

interface Deck {
  id: string;
  name: string;
  format: string;
  pokemon_count: number;
  trainer_count: number;
  energy_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  list: any; // The deck list data
}

interface MyDecksClientProps {
  userId: string;
}

export function MyDecksClient({ userId }: MyDecksClientProps) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importLoadingOpen, setImportLoadingOpen] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [importProgress, setImportProgress] = useState<number | undefined>(undefined);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    try {
      const { data, error } = await supabase
        .from('decks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDecks(data || []);
    } catch (error) {
      console.error('Failed to load decks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load decks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (deckId: string) => {
    if (!confirm('Are you sure you want to delete this deck?')) return;

    try {
      const { error } = await supabase
        .from('decks')
        .delete()
        .eq('id', deckId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Deck deleted successfully',
      });
      
      await loadDecks();
    } catch (error) {
      console.error('Failed to delete deck:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete deck',
        variant: 'destructive',
      });
    }
  };

  const handleDeckImported = () => {
    loadDecks();
    setImportDialogOpen(false);
  };

  const handleImportDeck = async (deckName: string, format: 'Standard' | 'Expanded', deckList: string) => {
    // Close import dialog and show loading dialog
    setImportDialogOpen(false);
    setImportLoadingOpen(true);
    setImportStatus('Parsing deck list...');
    setImportProgress(undefined);

    try {
      // Parse the deck list
      const parsedCards = parseDeckList(deckList);
      
      if (parsedCards.length === 0) {
        throw new Error('No cards found in deck list');
      }

      setImportStatus(`Found ${parsedCards.length} unique cards. Fetching card data...`);

      // Fetch card data from Pokemon TCG API
      const cardsWithData = await fetchCardData(parsedCards, (progress) => {
        setImportProgress(progress);
        setImportStatus(`Fetching card data... ${progress}%`);
      });

      // Count card types
      let pokemonCount = 0;
      let trainerCount = 0;
      let energyCount = 0;
      let totalCount = 0;

      cardsWithData.forEach(({ card, count }) => {
        totalCount += count;
        if (card.supertype === 'Pokémon') {
          pokemonCount += count;
        } else if (card.supertype === 'Trainer') {
          trainerCount += count;
        } else if (card.supertype === 'Energy') {
          energyCount += count;
        }
      });

      if (totalCount !== 60) {
        toast({
          title: 'Warning',
          description: `Deck contains ${totalCount} cards instead of 60`,
          variant: 'destructive',
        });
      }

      setImportStatus('Saving deck...');
      setImportProgress(undefined);

      // Save to database using the correct schema
      const deckData = {
        user_id: userId,
        name: deckName,
        format,
        pokemon_count: pokemonCount,
        trainer_count: trainerCount,
        energy_count: energyCount,
        list: cardsWithData,
        is_active: false,
      };

      const { error } = await supabase
        .from('decks')
        .insert(deckData);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Deck imported successfully',
      });
      
      // Reload decks
      await loadDecks();
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to import deck',
        variant: 'destructive',
      });
    } finally {
      // Close loading dialog
      setImportLoadingOpen(false);
      setImportStatus('');
      setImportProgress(undefined);
    }
  };

  const handleViewDeck = (deck: Deck) => {
    setSelectedDeck(deck);
    setViewerOpen(true);
  };

  const handleSetActive = async (deckId: string) => {
    try {
      // First, set all decks as inactive
      const { error: deactivateError } = await supabase
        .from('decks')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (deactivateError) throw deactivateError;

      // Then set the selected deck as active
      const { error: activateError } = await supabase
        .from('decks')
        .update({ is_active: true })
        .eq('id', deckId);

      if (activateError) throw activateError;

      toast({
        title: 'Success',
        description: 'Deck set as active',
      });

      // Reload decks to update UI
      await loadDecks();
      
      // Update the selected deck if it's still open
      if (selectedDeck?.id === deckId) {
        const updatedDeck = decks.find(d => d.id === deckId);
        if (updatedDeck) {
          setSelectedDeck({ ...updatedDeck, is_active: true });
        }
      }
    } catch (error) {
      console.error('Failed to set active deck:', error);
      toast({
        title: 'Error',
        description: 'Failed to set active deck',
        variant: 'destructive',
      });
    }
  };

  const handleExportDeck = (deck: Deck) => {
    const pokemonCards = deck.list.filter(({ card }: any) => card.supertype === 'Pokémon');
    const trainerCards = deck.list.filter(({ card }: any) => card.supertype === 'Trainer');
    const energyCards = deck.list.filter(({ card }: any) => card.supertype === 'Energy');

    const formatCardForExport = (card: any, count: number) => {
      let setCode = card.set?.id || '';
      let number = card.number || '';
      return `${count} ${card.name} ${setCode.toUpperCase()} ${number}`;
    };

    let exportText = '';
    
    if (pokemonCards.length > 0) {
      exportText += `Pokémon: ${deck.pokemon_count}\n`;
      pokemonCards.forEach(({ card, count }: any) => {
        exportText += formatCardForExport(card, count) + '\n';
      });
      exportText += '\n';
    }
    
    if (trainerCards.length > 0) {
      exportText += `Trainer: ${deck.trainer_count}\n`;
      trainerCards.forEach(({ card, count }: any) => {
        exportText += formatCardForExport(card, count) + '\n';
      });
      exportText += '\n';
    }
    
    if (energyCards.length > 0) {
      exportText += `Energy: ${deck.energy_count}\n`;
      energyCards.forEach(({ card, count }: any) => {
        exportText += formatCardForExport(card, count) + '\n';
      });
    }

    // Download the file
    const blob = new Blob([exportText.trim()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deck.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Exported!',
      description: 'Deck list downloaded',
    });
  };

  if (loading) {
    return <div>Loading decks...</div>;
  }

  return (
    <>
      <div className="mb-6">
        <Button onClick={() => setImportDialogOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Import Deck
        </Button>
      </div>

      {decks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground mb-4">No decks yet</p>
            <Button onClick={() => setImportDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Import your first deck
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <Card key={deck.id} className={deck.is_active ? 'ring-2 ring-green-600' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{deck.name}</CardTitle>
                  {deck.is_active && (
                    <Badge variant="default" className="bg-green-600">
                      Active
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  {deck.format} • {deck.pokemon_count + deck.trainer_count + deck.energy_count} cards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <div>Pokémon: {deck.pokemon_count}</div>
                  <div>Trainers: {deck.trainer_count}</div>
                  <div>Energy: {deck.energy_count}</div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <div className="flex w-full gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewDeck(deck)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleExportDeck(deck)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
                <div className="flex w-full gap-2">
                  <Button
                    variant={deck.is_active ? "secondary" : "default"}
                    size="sm"
                    className="flex-1"
                    onClick={() => handleSetActive(deck.id)}
                    disabled={deck.is_active}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {deck.is_active ? 'Active' : 'Set Active'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(deck.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <DeckImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={handleImportDeck}
      />

      <DeckImportLoading
        open={importLoadingOpen}
        status={importStatus}
        progress={importProgress}
      />

      <DeckViewerDialog
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        deck={selectedDeck}
      />
    </>
  );
}