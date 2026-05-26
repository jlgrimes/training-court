'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card as UICard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Database, Json } from '@/database.types';
import { createClient } from '@/utils/supabase/client';
import { MAX_SAVED_DECKLISTS } from './deckbuilder.constants';

const STORAGE_KEY = 'ptcg-deckbuilder-v2';
const MAX_DECK_SIZE = 60;
const ALL_SETS_ID = 'all';

type CardMetadata = {
  hp?: string;
  supertype?: string;
  setId?: string;
  setCode?: string;
  setName?: string;
  setSeries?: string;
  setReleaseDate?: string;
  subtypes?: string[];
  energyKind?: 'Basic' | 'Special';
  number?: string;
  cardText: string[];
  weakness: string[];
  resistance: string[];
  retreatCost: string[];
  legalityIcon?: string;
  rarity?: string;
  rulebox: string[];
};

type CatalogCard = {
  id: string;
  localId: string;
  name: string;
  imageUrlHiRes?: string;
  imageUrl?: string;
  category: string;
  metadata: CardMetadata;
};

type DeckEntry = {
  id: string;
  localId: string;
  name: string;
  imageUrlHiRes?: string;
  imageUrl?: string;
  qty: number;
  order?: number;
  category?: string;
  metadata?: CardMetadata;
};

type PreviewSource = 'deck' | 'search';

type StoredDeck = {
  name: string;
  selectedSetId: string;
  entries: Array<DeckEntry>;
};

type SavedDeck = StoredDeck & {
  id: string;
  savedAt: string;
};
type DeckbuilderView = 'library' | 'editor';

type DeckbuilderClientProps = {
  initialDeckId?: string;
  userId: string;
};
type DecklistRow = Database['public']['Tables']['decklists']['Row'];
type ImportResponse = {
  entries: DeckEntry[];
  totalCards: number;
  unresolved: string[];
  parsedLines: number;
  importedLines: number;
  code: number;
};

type SearchCardsResponse = {
  cards: CatalogCard[];
  returned: number;
  code: number;
};

const buildImageUrl = (imageUrlHiRes?: string, imageUrl?: string): string | undefined => {
  if (imageUrlHiRes) {
    return imageUrlHiRes;
  }

  if (imageUrl) {
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    return `${imageUrl}/low.png`;
  }

  return undefined;
};

const normalizeStoredDeck = (parsed: StoredDeck): StoredDeck => {
  if (!Array.isArray(parsed.entries)) {
    return {
      name: parsed.name ?? 'Untitled Deck',
      selectedSetId: parsed.selectedSetId ?? '',
      entries: [],
    };
  }

  const entries = parsed.entries.map((entry, index) => ({
    ...entry,
    order: entry.order ?? index,
    metadata: entry.metadata ?? {
      cardText: [],
      weakness: [],
      resistance: [],
      retreatCost: [],
      rulebox: [],
    },
  }));

  return {
    name: parsed.name ?? 'Untitled Deck',
    selectedSetId: parsed.selectedSetId ?? '',
    entries,
  };
};

const normalizeDeckEntries = (entries: unknown): DeckEntry[] => {
  if (!Array.isArray(entries)) {
    return [];
  }

  return normalizeStoredDeck({
    name: 'Untitled Deck',
    selectedSetId: ALL_SETS_ID,
    entries: entries as DeckEntry[],
  }).entries;
};

const toSavedDeck = (row: DecklistRow): SavedDeck => ({
  id: row.id,
  name: row.name,
  selectedSetId: ALL_SETS_ID,
  entries: normalizeDeckEntries(row.cards),
  savedAt: row.updated_at ?? row.created_at,
});

const readCardsBySet = async (
  setId: string,
  query: string
): Promise<CatalogCard[]> => {
  const normalizedQuery = query.trim();
  const effectiveSetId = setId || ALL_SETS_ID;
  const limit = normalizedQuery ? '2000' : effectiveSetId === ALL_SETS_ID ? '400' : '1200';
  const params = new URLSearchParams({ setId: effectiveSetId, limit });
  if (normalizedQuery) {
    params.set('query', normalizedQuery);
  }
  const response = await fetch(`/api/ptcg/cards/search?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to load cards');
  }

  const payload = (await response.json()) as SearchCardsResponse;
  return payload.cards ?? [];
};

const toDeckMap = (entries: Array<DeckEntry>): Record<string, DeckEntry> => {
  return entries.reduce<Record<string, DeckEntry>>((acc, entry) => {
    acc[entry.id] = entry;
    return acc;
  }, {});
};

const getNextDeckOrder = (deckState: Record<string, DeckEntry>): number => {
  const maxOrder = Object.values(deckState).reduce((max, entry) => {
    const current = typeof entry.order === 'number' ? entry.order : -1;
    return current > max ? current : max;
  }, -1);
  return maxOrder + 1;
};

const getUniqueDeckName = (requestedName: string, existingDecks: SavedDeck[]): string => {
  const baseName = requestedName.trim() || 'Untitled Deck';
  const escapedBase = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const suffixPattern = new RegExp(`^${escapedBase}(?:\\s+(\\d+))?$`, 'i');

  let hasExactMatch = false;
  let maxSuffix = 0;
  for (const deck of existingDecks) {
    const match = deck.name.trim().match(suffixPattern);
    if (!match) {
      continue;
    }
    if (!match[1]) {
      hasExactMatch = true;
      continue;
    }

    const parsed = Number(match[1]);
    if (Number.isFinite(parsed) && parsed > maxSuffix) {
      maxSuffix = parsed;
    }
  }

  if (!hasExactMatch && maxSuffix === 0) {
    return baseName;
  }
  return `${baseName} ${maxSuffix + 1}`;
};

const formatDecklistName = (name: string): string => {
  return name.replace(/^Pokemon\b/i, 'Pokémon');
};

const normalizeForMatch = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const getDecklistSection = (entry: DeckEntry): 'pokemon' | 'trainer' | 'energy' | 'other' => {
  const normalizedSupertype = normalizeForMatch(entry.metadata?.supertype ?? '');
  if (normalizedSupertype === 'pokemon') {
    return 'pokemon';
  }
  if (normalizedSupertype === 'trainer') {
    return 'trainer';
  }
  if (normalizedSupertype === 'energy') {
    return 'energy';
  }

  const normalizedCategory = normalizeForMatch(entry.category ?? '');
  if (normalizedCategory === 'pokemon') {
    return 'pokemon';
  }
  if (normalizedCategory === 'trainer') {
    return 'trainer';
  }
  if (normalizedCategory === 'energy') {
    return 'energy';
  }
  return 'other';
};

const buildDecklistText = (entries: DeckEntry[]): string => {
  const orderedEntries = entries.slice().sort((left, right) => {
    const leftOrder = typeof left.order === 'number' ? left.order : Number.MAX_SAFE_INTEGER;
    const rightOrder = typeof right.order === 'number' ? right.order : Number.MAX_SAFE_INTEGER;
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }
    return left.name.localeCompare(right.name, undefined, { sensitivity: 'base' });
  });

  const pokemon = orderedEntries.filter((entry) => getDecklistSection(entry) === 'pokemon');
  const trainer = orderedEntries.filter((entry) => getDecklistSection(entry) === 'trainer');
  const energy = orderedEntries.filter((entry) => getDecklistSection(entry) === 'energy');
  const other = orderedEntries.filter((entry) => getDecklistSection(entry) === 'other');

  const formatLine = (entry: DeckEntry): string => {
    const setCode = (entry.metadata?.setCode ?? entry.metadata?.setId ?? '').toUpperCase();
    const number = entry.metadata?.number ?? entry.localId ?? '';
    const cardName = formatDecklistName(entry.name);
    return `${entry.qty} ${cardName}${setCode && number ? ` ${setCode} ${number}` : ''}`;
  };

  return [
    `Pokémon: ${pokemon.reduce((sum, entry) => sum + entry.qty, 0)}`,
    '',
    ...pokemon.map(formatLine),
    '',
    `Trainer: ${trainer.reduce((sum, entry) => sum + entry.qty, 0)}`,
    ...trainer.map(formatLine),
    '',
    `Energy: ${energy.reduce((sum, entry) => sum + entry.qty, 0) + other.reduce((sum, entry) => sum + entry.qty, 0)}`,
    ...energy.map(formatLine),
    ...other.map(formatLine),
  ].join('\n');
};

const isBasicEnergy = (card: Pick<CatalogCard, 'category' | 'name' | 'metadata'>): boolean => {
  if (card.metadata.energyKind === 'Special') {
    return false;
  }

  if (card.metadata.energyKind === 'Basic') {
    return true;
  }

  const normalizedName = normalizeForMatch(card.name ?? '');

  // Strong fallback for catalog entries that omit energy metadata/category.
  return /^(basic\s+)?(grass|fire|water|lightning|psychic|fighting|darkness|metal|fairy)\s+energy$/.test(
    normalizedName
  );
};

const getRuleViolation = (card: CatalogCard, deckState: Record<string, DeckEntry>): string | null => {
  if (isBasicEnergy(card)) {
    return null;
  }

  const sameNameQty = Object.values(deckState)
    .filter((entry) => entry.name.toLowerCase() === card.name.toLowerCase())
    .reduce((sum, entry) => sum + entry.qty, 0);

  if (sameNameQty + 1 > 4) {
    return 'You can only include up to 4 cards with that name.';
  }

  return null;
};

export function DeckbuilderClient(props: DeckbuilderClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const deckClickTimersRef = useRef<Record<string, number>>({});
  const lastDeckClickAtRef = useRef<Record<string, number>>({});
  const dragCardIdRef = useRef<string | null>(null);
  const [cards, setCards] = useState<Array<CatalogCard>>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deckName, setDeckName] = useState('Untitled Deck');
  const [selectedSavedDeckId, setSelectedSavedDeckId] = useState('');
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [deck, setDeck] = useState<Record<string, DeckEntry>>({});
  const [isHydrated, setIsHydrated] = useState(false);
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>([]);
  const [view, setView] = useState<DeckbuilderView>('library');
  const [previewCard, setPreviewCard] = useState<CatalogCard | null>(null);
  const [previewSource, setPreviewSource] = useState<PreviewSource>('search');
  const [isImporting, setIsImporting] = useState(false);
  const [isSavingDeck, setIsSavingDeck] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = normalizeStoredDeck(JSON.parse(raw) as StoredDeck);
        if (parsed.name) {
          setDeckName(parsed.name);
        }
        setDeck(toDeckMap(parsed.entries));
      }

      if (props.initialDeckId === 'new') {
        setSelectedSavedDeckId('');
        setDeckName('Untitled Deck');
        setDeck({});
        setView('editor');
      }
    } catch {
      // Ignore corrupted local deck state and keep defaults.
    } finally {
      setIsHydrated(true);
    }
  }, [props.initialDeckId]);

  useEffect(() => {
    let isActive = true;

    const loadSavedDecklists = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('decklists')
        .select('*')
        .eq('user_id', props.userId)
        .eq('game', 'pokemon-tcg')
        .order('updated_at', { ascending: false })
        .limit(MAX_SAVED_DECKLISTS)
        .returns<DecklistRow[]>();

      if (!isActive) {
        return;
      }

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Unable to load saved decklists.',
          description: error.message,
        });
        return;
      }

      const nextSavedDecks = (data ?? []).map(toSavedDeck);
      setSavedDecks(nextSavedDecks);

      if (props.initialDeckId && props.initialDeckId !== 'new') {
        const initialDeck = nextSavedDecks.find((savedDeck) => savedDeck.id === props.initialDeckId);
        if (initialDeck) {
          setSelectedSavedDeckId(initialDeck.id);
          setDeckName(initialDeck.name);
          setDeck(toDeckMap(initialDeck.entries));
          setView('editor');
        } else {
          setView('library');
        }
      }
    };

    void loadSavedDecklists();

    return () => {
      isActive = false;
    };
  }, [props.initialDeckId, props.userId, toast]);

  useEffect(() => {
    if (!submittedQuery.trim()) {
      setCards([]);
      setIsLoadingCards(false);
      return;
    }

    let isActive = true;

    const loadCards = async () => {
      setIsLoadingCards(true);
      setError(null);

      try {
        const cardsForSet = await readCardsBySet(ALL_SETS_ID, submittedQuery);
        if (!isActive) {
          return;
        }
        setCards(cardsForSet);
      } catch {
        if (isActive) {
          setError('Failed to load cards for the selected set.');
          setCards([]);
        }
      } finally {
        if (isActive) {
          setIsLoadingCards(false);
        }
      }
    };

    void loadCards();

    return () => {
      isActive = false;
    };
  }, [submittedQuery]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const payload: StoredDeck = {
      name: deckName,
      selectedSetId: ALL_SETS_ID,
      entries: Object.values(deck),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [deck, deckName, isHydrated]);

  const filteredCards = useMemo(() => cards, [cards]);

  const submitCardSearch = useCallback(() => {
    const nextQuery = query.trim();
    if (!nextQuery) {
      setSubmittedQuery('');
      setCards([]);
      return;
    }

    setSubmittedQuery(nextQuery);
  }, [query]);

  const handleCardSearchChange = useCallback((value: string) => {
    setQuery(value);
    setSubmittedQuery('');
    setCards([]);
    setIsLoadingCards(false);
  }, []);

  const deckEntries = useMemo(() => {
    return Object.values(deck).sort((a, b) => {
      if (typeof a.order === 'number' && typeof b.order === 'number' && a.order !== b.order) {
        return a.order - b.order;
      }
      return a.name.localeCompare(b.name);
    });
  }, [deck]);

  const totalCards = useMemo(() => {
    return deckEntries.reduce((sum, entry) => sum + entry.qty, 0);
  }, [deckEntries]);

  const addCard = useCallback((card: CatalogCard) => {
    let blockedReason: string | null = null;
    setDeck((prev) => {
      const violation = getRuleViolation(card, prev);
      if (violation) {
        blockedReason = violation;
        return prev;
      }

      const existing = prev[card.id];
      if (existing) {
        return {
          ...prev,
          [card.id]: {
            ...existing,
            qty: existing.qty + 1,
          },
        };
      }

      return {
        ...prev,
        [card.id]: {
          id: card.id,
          localId: card.localId,
          name: card.name,
          imageUrlHiRes: card.imageUrlHiRes,
          imageUrl: card.imageUrl,
          qty: 1,
          order: getNextDeckOrder(prev),
          category: card.category,
          metadata: card.metadata,
        },
      };
    });

    if (blockedReason) {
      toast({ title: blockedReason });
    }
  }, [toast]);

  const toCatalogCard = useCallback((entry: DeckEntry): CatalogCard => {
    return {
      id: entry.id,
      localId: entry.localId,
      name: entry.name,
      imageUrlHiRes: entry.imageUrlHiRes,
      imageUrl: entry.imageUrl,
      category: entry.category ?? 'Unknown',
      metadata: entry.metadata ?? {
        cardText: [],
        weakness: [],
        resistance: [],
        retreatCost: [],
        rulebox: [],
      },
    };
  }, []);

  const decrementCard = useCallback((cardId: string) => {
    setDeck((prev) => {
      const existing = prev[cardId];
      if (!existing) {
        return prev;
      }

      if (existing.qty <= 1) {
        const { [cardId]: _, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [cardId]: {
          ...existing,
          qty: existing.qty - 1,
        },
      };
    });
  }, []);

  useEffect(() => {
    return () => {
      Object.values(deckClickTimersRef.current).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      deckClickTimersRef.current = {};
    };
  }, []);

  const clearDeck = useCallback(() => {
    setDeck({});
  }, []);

  const moveDeckCard = useCallback((fromCardId: string, toCardId: string) => {
    if (!fromCardId || !toCardId || fromCardId === toCardId) {
      return;
    }

    setDeck((prev) => {
      const ordered = Object.values(prev).slice().sort((a, b) => {
        const aOrder = typeof a.order === 'number' ? a.order : 0;
        const bOrder = typeof b.order === 'number' ? b.order : 0;
        return aOrder - bOrder;
      });

      const fromIndex = ordered.findIndex((entry) => entry.id === fromCardId);
      const toIndex = ordered.findIndex((entry) => entry.id === toCardId);
      if (fromIndex === -1 || toIndex === -1) {
        return prev;
      }

      const [moved] = ordered.splice(fromIndex, 1);
      ordered.splice(toIndex, 0, moved);

      const next: Record<string, DeckEntry> = {};
      ordered.forEach((entry, index) => {
        next[entry.id] = {
          ...entry,
          order: index,
        };
      });

      return next;
    });
  }, []);

  const saveDeck = useCallback(async () => {
    const normalizedName = deckName.trim() || 'Untitled Deck';
    const now = new Date().toISOString();
    const entries = Object.values(deck);

    if (entries.length === 0) {
      toast({ title: 'Add at least one card before saving.' });
      return;
    }

    const existingById = selectedSavedDeckId
      ? savedDecks.find((savedDeck) => savedDeck.id === selectedSavedDeckId)
      : undefined;
    const nextName = existingById ? normalizedName : getUniqueDeckName(normalizedName, savedDecks);

    setIsSavingDeck(true);
    const supabase = createClient();

    if (!existingById) {
      const { count, error: countError } = await supabase
        .from('decklists')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', props.userId)
        .eq('game', 'pokemon-tcg');

      if (countError) {
        setIsSavingDeck(false);
        toast({
          variant: 'destructive',
          title: 'Unable to save decklist.',
          description: countError.message,
        });
        return;
      }

      if ((count ?? 0) >= MAX_SAVED_DECKLISTS) {
        setIsSavingDeck(false);
        toast({
          variant: 'destructive',
          title: 'Decklist limit reached.',
          description: `Delete a saved decklist before creating a new one. The current limit is ${MAX_SAVED_DECKLISTS}.`,
        });
        return;
      }
    }

    const payload = {
      name: nextName,
      user_id: props.userId,
      game: 'pokemon-tcg',
      cards: entries as unknown as Json,
      updated_at: now,
    };

    const request = existingById
      ? supabase
          .from('decklists')
          .update(payload)
          .eq('id', existingById.id)
          .eq('user_id', props.userId)
          .select()
          .single<DecklistRow>()
      : supabase
          .from('decklists')
          .insert(payload)
          .select()
          .single<DecklistRow>();

    const { data, error } = await request;
    setIsSavingDeck(false);

    if (error || !data) {
      toast({
        variant: 'destructive',
        title: 'Unable to save decklist.',
        description: error?.message,
      });
      return;
    }

    const nextDeck = toSavedDeck(data);
    const nextSavedDecks = existingById
      ? savedDecks.map((savedDeck) => (savedDeck.id === existingById.id ? nextDeck : savedDeck))
      : [nextDeck, ...savedDecks];

    setSavedDecks(nextSavedDecks);
    setSelectedSavedDeckId(nextDeck.id);
    setDeckName(nextName);
    router.replace(`/ptcg/deckbuilder/${nextDeck.id}`);
    toast({ title: `Saved "${nextName}"` });
  }, [deck, deckName, props.userId, router, savedDecks, selectedSavedDeckId, toast]);

  const openSavedDeck = useCallback((savedDeck: SavedDeck) => {
    setSelectedSavedDeckId(savedDeck.id);
    setDeckName(savedDeck.name);
    setDeck(toDeckMap(savedDeck.entries));
    setView('editor');
    router.push(`/ptcg/deckbuilder/${savedDeck.id}`);
  }, [router]);

  const deleteSavedDeck = useCallback(async (savedDeck: SavedDeck) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('decklists')
      .delete()
      .eq('id', savedDeck.id)
      .eq('user_id', props.userId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Unable to delete decklist.',
        description: error.message,
      });
      return;
    }

    const nextSavedDecks = savedDecks.filter((deckItem) => deckItem.id !== savedDeck.id);
    setSavedDecks(nextSavedDecks);
    if (selectedSavedDeckId === savedDeck.id) {
      setSelectedSavedDeckId('');
    }
    toast({ title: `Deleted "${savedDeck.name}"` });
  }, [props.userId, savedDecks, selectedSavedDeckId, toast]);

  const startNewDeck = useCallback(() => {
    setSelectedSavedDeckId('');
    setDeckName('Untitled Deck');
    setDeck({});
    setView('editor');
    router.push('/ptcg/deckbuilder/new');
  }, [router]);

  const isOverLimit = totalCards > MAX_DECK_SIZE;

  const importFromClipboard = useCallback(async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText.trim()) {
        toast({ title: 'Clipboard is empty.' });
        return;
      }

      setIsImporting(true);

      const response = await fetch('/api/ptcg/cards/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ decklist: clipboardText }),
      });

      const payload = (await response.json()) as ImportResponse;
      if (!response.ok) {
        throw new Error((payload as { message?: string }).message ?? 'Import failed');
      }

      const importEntries = payload.entries ?? [];
      const importDeckMap: Record<string, DeckEntry> = {};
      const importViolations: string[] = [];

      for (const entry of importEntries) {
        const asCard: CatalogCard = {
          id: entry.id,
          localId: entry.localId,
          name: entry.name,
          imageUrlHiRes: entry.imageUrlHiRes,
          imageUrl: entry.imageUrl,
          category: entry.category ?? 'Unknown',
          metadata: {
            ...(entry.metadata ?? {
              cardText: [],
              weakness: [],
              resistance: [],
              retreatCost: [],
              rulebox: [],
            }),
          },
        };

        for (let i = 0; i < entry.qty; i += 1) {
          const violation = getRuleViolation(asCard, importDeckMap);
          if (violation) {
            importViolations.push(`${entry.name}: ${violation}`);
            break;
          }

          const existing = importDeckMap[entry.id];
          if (existing) {
            existing.qty += 1;
          } else {
            const nextOrder = getNextDeckOrder(importDeckMap);
            importDeckMap[entry.id] = {
              ...entry,
              qty: 1,
              order: nextOrder,
            };
          }
        }
      }

      // Import is authoritative: replace current deck contents entirely.
      setDeck({});
      setDeck(importDeckMap);
      setSelectedSavedDeckId('');

      if (importViolations.length > 0) {
        toast({ title: `Imported with deck rule limits (${importViolations.length} line(s) capped).` });
      } else if (payload.unresolved?.length) {
        toast({ title: `Imported ${payload.importedLines}/${payload.parsedLines} lines (${payload.unresolved.length} unresolved).` });
      } else {
        const importedCount = Object.values(importDeckMap).reduce((sum, deckEntry) => sum + deckEntry.qty, 0);
        toast({ title: `Imported ${importedCount} cards.` });
      }
    } catch {
      toast({ title: 'Clipboard access blocked.' });
    } finally {
      setIsImporting(false);
    }
  }, [toast]);

  const exportToClipboard = useCallback(async () => {
    try {
      const deckEntries = Object.values(deck);
      const decklistText = buildDecklistText(deckEntries);
      await navigator.clipboard.writeText(decklistText);
      toast({ title: 'Decklist copied to clipboard.' });
    } catch {
      toast({ title: 'Unable to copy decklist to clipboard.' });
    }
  }, [deck, toast]);

  if (view === 'library') {
    return (
      <UICard>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <button
              type="button"
              onClick={startNewDeck}
              className="rounded-md bg-muted/20 p-3 text-left transition-colors hover:bg-muted/40"
            >
              <div className="mb-2 grid aspect-[8/5] place-items-center rounded bg-muted">
                <span className="text-4xl font-semibold text-muted-foreground">+</span>
              </div>
              <p className="truncate text-sm font-semibold">New Deck</p>
              <p className="text-xs text-muted-foreground">Create from scratch</p>
            </button>

            {savedDecks.map((savedDeck) => (
              <div key={savedDeck.id} className="rounded-md p-3">
                <button
                  type="button"
                  onClick={() => openSavedDeck(savedDeck)}
                  className="w-full text-left"
                >
                  <div className="mb-2 grid aspect-[8/5] grid-cols-8 grid-rows-5 gap-px overflow-hidden rounded bg-muted p-0.5">
                    {savedDeck.entries.slice(0, 40).map((entry) => (
                      <div key={entry.id} className="overflow-hidden rounded-[2px] bg-muted/40">
                        {buildImageUrl(entry.imageUrlHiRes, entry.imageUrl) ? (
                          <img
                            src={buildImageUrl(entry.imageUrlHiRes, entry.imageUrl)}
                            alt={entry.name}
                            className="h-full w-full object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-full w-full bg-muted" />
                        )}
                      </div>
                    ))}
                    {Array.from({ length: Math.max(0, 40 - savedDeck.entries.length) }).map((_, index) => (
                      <div key={`empty-${savedDeck.id}-${index}`} className="rounded-[2px] bg-muted/30" />
                    ))}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{savedDeck.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Last Saved {new Date(savedDeck.savedAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Delete ${savedDeck.name}`}
                      className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        void deleteSavedDeck(savedDeck);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </button>
              </div>
            ))}
          </div>
          {savedDecks.length === 0 && (
            <p className="text-sm text-muted-foreground">No saved decks yet. Use New Deck to get started.</p>
          )}
        </CardContent>
      </UICard>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-8">
      <UICard className="lg:col-span-5">
        <CardContent className="space-y-4 pt-4">
          <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto]">
            <Input
              value={deckName}
              onChange={(event) => setDeckName(event.target.value)}
              placeholder="Deck name"
            />
            <Button onClick={saveDeck} disabled={deckEntries.length === 0 || isSavingDeck}>
              {isSavingDeck ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="outline" onClick={importFromClipboard} disabled={isImporting}>
              {isImporting ? 'Importing...' : 'Import'}
            </Button>
            <Button variant="outline" onClick={exportToClipboard}>
              Export
            </Button>
            <Button variant="outline" onClick={clearDeck}>
              Clear
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <div className={isOverLimit ? 'text-red-400 font-semibold' : undefined}>
              Cards: {totalCards}/{MAX_DECK_SIZE}
            </div>
          </div>

          <div className="pr-1">
            {deckEntries.length === 0 && (
              <p className="text-sm text-muted-foreground">No cards in deck yet.</p>
            )}

            {deckEntries.length > 0 && (
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5 md:grid-cols-6 xl:grid-cols-8">
                {deckEntries.map((entry) => (
                  <div
                    key={entry.id}
                    role="button"
                    tabIndex={0}
                    draggable
                    onClick={(event) => {
                      const now = Date.now();
                      const lastClickAt = lastDeckClickAtRef.current[entry.id] ?? 0;
                      const isDoubleClick = now - lastClickAt <= 280;

                      if (isDoubleClick) {
                        const existingTimer = deckClickTimersRef.current[entry.id];
                        if (existingTimer) {
                          window.clearTimeout(existingTimer);
                          delete deckClickTimersRef.current[entry.id];
                        }
                        lastDeckClickAtRef.current[entry.id] = 0;
                        setPreviewCard(toCatalogCard(entry));
                        setPreviewSource('deck');
                        return;
                      }

                      lastDeckClickAtRef.current[entry.id] = now;
                      const existingTimer = deckClickTimersRef.current[entry.id];
                      if (existingTimer) {
                        window.clearTimeout(existingTimer);
                      }
                      deckClickTimersRef.current[entry.id] = window.setTimeout(() => {
                        addCard(toCatalogCard(entry));
                        delete deckClickTimersRef.current[entry.id];
                        lastDeckClickAtRef.current[entry.id] = 0;
                      }, 210);
                    }}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      const existingTimer = deckClickTimersRef.current[entry.id];
                      if (existingTimer) {
                        window.clearTimeout(existingTimer);
                        delete deckClickTimersRef.current[entry.id];
                      }
                      decrementCard(entry.id);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addCard(toCatalogCard(entry));
                      }
                      if (event.key === ' ') {
                        event.preventDefault();
                        setPreviewCard(toCatalogCard(entry));
                        setPreviewSource('deck');
                      }
                      if (event.key === 'Backspace' || event.key === 'Delete') {
                        event.preventDefault();
                        decrementCard(entry.id);
                      }
                    }}
                    onDragStart={() => {
                      dragCardIdRef.current = entry.id;
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const fromCardId = dragCardIdRef.current;
                      if (!fromCardId) {
                        return;
                      }
                      moveDeckCard(fromCardId, entry.id);
                      dragCardIdRef.current = null;
                    }}
                    onDragEnd={() => {
                      dragCardIdRef.current = null;
                    }}
                  >
                    <div className="relative overflow-hidden rounded-md bg-muted">
                      {buildImageUrl(entry.imageUrlHiRes, entry.imageUrl) ? (
                        <img
                          src={buildImageUrl(entry.imageUrlHiRes, entry.imageUrl)}
                          alt={entry.name}
                          className="w-full aspect-[5/7] object-contain bg-muted"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full aspect-[5/7] bg-muted" />
                      )}
                      <div className="absolute bottom-[7%] left-1/2 flex min-h-12 min-w-12 -translate-x-1/2 items-center justify-center rounded-full bg-black/85 px-3 text-2xl font-extrabold text-white shadow">
                        {entry.qty}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </CardContent>
      </UICard>

      <UICard className="flex h-[calc(100vh-9rem)] flex-col lg:sticky lg:top-4 lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-base text-slate-100" />
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col space-y-2">
          <div>
            <div className="flex gap-2">
              <Input
                id="card-search"
                value={query}
                onChange={(event) => handleCardSearchChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    submitCardSearch();
                  }
                }}
                placeholder="Search by card name"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Search cards"
                onClick={submitCardSearch}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
            {isLoadingCards && <p className="text-sm text-muted-foreground">Loading cards...</p>}

            {!isLoadingCards &&
              submittedQuery.trim() &&
              filteredCards.map((card) => (
                <div
                  key={card.id}
                  className="cursor-pointer rounded-md p-1 transition-transform duration-150 ease-out hover:scale-[1.03] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  role="button"
                  tabIndex={0}
                  onClick={() => addCard(card)}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    setPreviewCard(card);
                    setPreviewSource('search');
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addCard(card);
                    }
                    if (event.key === ' ') {
                      event.preventDefault();
                      setPreviewCard(card);
                      setPreviewSource('search');
                    }
                  }}
                >
                  {buildImageUrl(card.imageUrlHiRes, card.imageUrl) ? (
                    <img
                      src={buildImageUrl(card.imageUrlHiRes, card.imageUrl)}
                      alt={card.name}
                      className="w-full aspect-[5/7] rounded object-contain bg-muted"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full aspect-[5/7] rounded bg-muted" />
                  )}
                </div>
              ))}
          </div>
        </CardContent>
      </UICard>

      {previewCard && (
        <div
          className="fixed inset-0 z-50 bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewCard(null)}
        >
          <div className="relative mx-auto flex h-full max-w-5xl items-center justify-center">
            <button
              type="button"
              className="absolute right-2 top-2 rounded-md bg-black/70 px-3 py-2 text-sm text-white"
              onClick={(event) => {
                event.stopPropagation();
                setPreviewCard(null);
              }}
            >
              Close
            </button>

            {previewSource === 'search' && (
              <Button
                className="absolute left-2 top-2"
                onClick={(event) => {
                  event.stopPropagation();
                  addCard(previewCard);
                }}
              >
                Add to Deck
              </Button>
            )}

            {buildImageUrl(previewCard.imageUrlHiRes, previewCard.imageUrl) ? (
              <img
                src={buildImageUrl(previewCard.imageUrlHiRes, previewCard.imageUrl)}
                alt={previewCard.name}
                className="max-h-[95vh] w-auto max-w-full rounded object-contain"
                onClick={(event) => event.stopPropagation()}
              />
            ) : (
              <div className="h-[80vh] w-full max-w-3xl rounded bg-muted" onClick={(event) => event.stopPropagation()} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
