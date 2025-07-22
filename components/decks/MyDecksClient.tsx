'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Trash2, Star, Download, Copy, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { DeckImportExport } from './DeckImportExport';
import { DeckViewer } from './DeckViewer';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
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
  list?: any; // Card list data
}

interface MyDecksClientProps {
  userId: string;
}

export function MyDecksClient({ userId }: MyDecksClientProps) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [deckBuilderOpen, setDeckBuilderOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [viewingDeck, setViewingDeck] = useState<Deck | null>(null);
  const [tableExists, setTableExists] = useState(true);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    loadDecks();
  }, [userId]);

  const loadDecks = async () => {
    try {
      const { data, error } = await supabase
        .from('decks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          console.error('Decks table not found. Please run the migration.');
          // Don't throw, just set empty decks
          setDecks([]);
          setTableExists(false);
          return;
        }
        throw error;
      }
      setDecks(data || []);
    } catch (error) {
      console.error('Failed to load decks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your decks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportDeck = () => {
    setEditingDeck(null);
    setDeckBuilderOpen(true);
  };

  const handleExportDeck = (deck: Deck) => {
    // Export deck logic will be in DeckBuilder
    setEditingDeck(deck);
    setDeckBuilderOpen(true);
  };

  const handleViewDeck = (deck: Deck) => {
    setViewingDeck(deck);
  };

  const handleDeleteDeck = async (deckId: string) => {
    try {
      const { error } = await supabase
        .from('decks')
        .delete()
        .eq('id', deckId)
        .eq('user_id', userId);

      if (error) throw error;

      setDecks(decks.filter(d => d.id !== deckId));
      toast({
        title: 'Success',
        description: 'Deck deleted successfully',
      });
    } catch (error) {
      console.error('Failed to delete deck:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete deck',
        variant: 'destructive',
      });
    }
  };

  const handleSetActiveDeck = async (deckId: string) => {
    try {
      // First, unset any currently active deck
      await supabase
        .from('decks')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);

      // Then set the new active deck
      const { error } = await supabase
        .from('decks')
        .update({ is_active: true })
        .eq('id', deckId)
        .eq('user_id', userId);

      if (error) throw error;

      setDecks(decks.map(d => ({
        ...d,
        is_active: d.id === deckId
      })));

      toast({
        title: 'Success',
        description: 'Active deck updated',
      });
    } catch (error) {
      console.error('Failed to set active deck:', error);
      toast({
        title: 'Error',
        description: 'Failed to set active deck',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicateDeck = async (deck: Deck) => {
    try {
      const newDeck = {
        user_id: userId,
        name: `${deck.name} (Copy)`,
        format: deck.format,
        list: deck.list,
        pokemon_count: deck.pokemon_count,
        trainer_count: deck.trainer_count,
        energy_count: deck.energy_count,
        is_active: false,
      };

      const { data, error } = await supabase
        .from('decks')
        .insert(newDeck)
        .select()
        .single();

      if (error) throw error;

      setDecks([data, ...decks]);
      toast({
        title: 'Success',
        description: 'Deck duplicated successfully',
      });
    } catch (error) {
      console.error('Failed to duplicate deck:', error);
      toast({
        title: 'Error',
        description: 'Failed to duplicate deck',
        variant: 'destructive',
      });
    }
  };

  const handleDeckSaved = (deck: Deck) => {
    if (editingDeck) {
      setDecks(decks.map(d => d.id === deck.id ? deck : d));
    } else {
      setDecks([deck, ...decks]);
    }
    setDeckBuilderOpen(false);
    setEditingDeck(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading your decks...</div>
      </div>
    );
  }

  if (!tableExists) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Database Setup Required</CardTitle>
            <CardDescription>
              The decks feature requires database setup. Please run the following SQL in your Supabase SQL Editor:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
              <code>{`CREATE TABLE IF NOT EXISTS public.decks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('Standard', 'Expanded')),
  list JSONB NOT NULL DEFAULT '{}',
  pokemon_count INTEGER NOT NULL DEFAULT 0,
  trainer_count INTEGER NOT NULL DEFAULT 0,
  energy_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`}</code>
            </pre>
            <p className="text-sm text-muted-foreground mt-4">
              See the full migration file at: <code>supabase/migrations/20240722_create_decks_table.sql</code>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Decks</h1>
          <p className="text-muted-foreground">Manage your Pokemon TCG decks</p>
        </div>
        <Button onClick={handleImportDeck} size="lg">
          <Upload className="mr-2 h-5 w-5" />
          Import Deck
        </Button>
      </div>

      {decks.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">You haven't imported any decks yet.</p>
            <Button onClick={handleImportDeck}>
              <Upload className="mr-2 h-4 w-4" />
              Import Your First Deck
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <Card key={deck.id} className={deck.is_active ? 'ring-2 ring-primary' : ''}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {deck.name}
                      {deck.is_active && (
                        <Star className="h-4 w-4 fill-primary text-primary" />
                      )}
                    </CardTitle>
                    <CardDescription>
                      Created {new Date(deck.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant={deck.format === 'Standard' ? 'default' : 'secondary'}>
                    {deck.format}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pokemon:</span>
                    <span>{deck.pokemon_count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Trainers:</span>
                    <span>{deck.trainer_count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Energy:</span>
                    <span>{deck.energy_count}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Total:</span>
                    <span>{deck.pokemon_count + deck.trainer_count + deck.energy_count}/60</span>
                  </div>

                  <div className="flex gap-2 pt-4">
                    {!deck.is_active && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetActiveDeck(deck.id)}
                        className="flex-1"
                      >
                        <Star className="mr-2 h-4 w-4" />
                        Set Active
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDeck(deck)}
                      title="View deck"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExportDeck(deck)}
                      title="Export deck list"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDuplicateDeck(deck)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Deck</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{deck.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteDeck(deck.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DeckImportExport
        open={deckBuilderOpen}
        onClose={() => {
          setDeckBuilderOpen(false);
          setEditingDeck(null);
        }}
        onSave={handleDeckSaved}
        editingDeck={editingDeck}
        userId={userId}
      />

      <DeckViewer
        open={!!viewingDeck}
        onClose={() => setViewingDeck(null)}
        deck={viewingDeck}
      />
    </div>
  );
}