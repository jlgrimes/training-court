'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card as UICard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

const STORAGE_KEY = 'ptcg-deckbuilder-v2';
const SAVED_DECKS_STORAGE_KEY = 'ptcg-deckbuilder-saved-v1';
const MAX_DECK_SIZE = 60;
const ALL_SETS_ID = 'all';

type CardMetadata = {
  hp?: string;
  setId?: string;
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
};
type ImportResponse = {
  entries: DeckEntry[];
  totalCards: number;
  unresolved: string[];
  parsedLines: number;
  importedLines: number;
  code: number;
};

type SetOption = {
  id: string;
  name: string;
  releaseDate?: string;
  cardCount: number;
};

type SetsResponse = {
  sets: SetOption[];
  code: number;
};

type SearchCardsResponse = {
  cards: CatalogCard[];
  totalInSet: number;
  totalMatched: number;
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

  const entries = parsed.entries.map((entry) => ({
    ...entry,
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

const readSets = async (): Promise<SetOption[]> => {
  const response = await fetch('/api/ptcg/cards/sets');
  if (!response.ok) {
    throw new Error('Failed to load sets');
  }

  const payload = (await response.json()) as SetsResponse;
  return payload.sets ?? [];
};

const readCardsBySet = async (
  setId: string,
  query: string
): Promise<{ cards: CatalogCard[]; totalInSet: number; totalMatched: number }> => {
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
  return {
    cards: payload.cards ?? [],
    totalInSet: payload.totalInSet ?? 0,
    totalMatched: payload.totalMatched ?? 0,
  };
};

const toDeckMap = (entries: Array<DeckEntry>): Record<string, DeckEntry> => {
  return entries.reduce<Record<string, DeckEntry>>((acc, entry) => {
    acc[entry.id] = entry;
    return acc;
  }, {});
};

const isBasicEnergy = (card: Pick<CatalogCard, 'category' | 'name' | 'metadata'>): boolean => {
  if (card.category !== 'Energy') {
    return false;
  }

  if (card.metadata.energyKind === 'Basic') {
    return true;
  }

  if (card.metadata.energyKind === 'Special') {
    return false;
  }

  return /basic/i.test(card.name) && /energy/i.test(card.name);
};

const isSpecialEnergy = (card: Pick<CatalogCard, 'category' | 'metadata'>): boolean => {
  return card.category === 'Energy' && card.metadata.energyKind === 'Special';
};

const isStadiumCard = (card: Pick<CatalogCard, 'metadata'>): boolean => {
  return (card.metadata.subtypes ?? []).some((subtype) => subtype.toLowerCase() === 'stadium');
};

const isFourCopyTypeRestricted = (card: Pick<CatalogCard, 'category' | 'metadata'>): boolean => {
  if (card.category === 'Pokemon' || card.category === 'Trainer') {
    return true;
  }
  if (isStadiumCard(card)) {
    return true;
  }
  if (isSpecialEnergy(card)) {
    return true;
  }
  return false;
};

const getRuleViolation = (card: CatalogCard, deckState: Record<string, DeckEntry>): string | null => {
  const existingById = deckState[card.id];
  const nextIdQty = (existingById?.qty ?? 0) + 1;

  if (isFourCopyTypeRestricted(card) && nextIdQty > 4) {
    return 'You can only include up to 4 copies of that card.';
  }

  if (!isBasicEnergy(card)) {
    const sameNameQty = Object.values(deckState)
      .filter((entry) => entry.name.toLowerCase() === card.name.toLowerCase())
      .reduce((sum, entry) => sum + entry.qty, 0);
    if (sameNameQty + 1 > 4) {
      return 'You can only include up to 4 cards with that name.';
    }
  }

  return null;
};

export function DeckbuilderClient(props: DeckbuilderClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const deckClickTimersRef = useRef<Record<string, number>>({});
  const lastDeckClickAtRef = useRef<Record<string, number>>({});
  const [sets, setSets] = useState<Array<SetOption>>([]);
  const [selectedSetId, setSelectedSetId] = useState('');
  const [cards, setCards] = useState<Array<CatalogCard>>([]);
  const [totalCardsInSelectedSet, setTotalCardsInSelectedSet] = useState(0);
  const [totalMatchedCards, setTotalMatchedCards] = useState(0);
  const [isLoadingSets, setIsLoadingSets] = useState(true);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deckName, setDeckName] = useState('Untitled Deck');
  const [selectedSavedDeckId, setSelectedSavedDeckId] = useState('');
  const [query, setQuery] = useState('');
  const [deck, setDeck] = useState<Record<string, DeckEntry>>({});
  const [isHydrated, setIsHydrated] = useState(false);
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>([]);
  const [view, setView] = useState<DeckbuilderView>('library');
  const [previewCard, setPreviewCard] = useState<CatalogCard | null>(null);
  const [previewSource, setPreviewSource] = useState<PreviewSource>('search');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = normalizeStoredDeck(JSON.parse(raw) as StoredDeck);
        if (parsed.name) {
          setDeckName(parsed.name);
        }
        if (parsed.selectedSetId) {
          setSelectedSetId(parsed.selectedSetId);
        }
        setDeck(toDeckMap(parsed.entries));
      }

      const rawSavedDecks = localStorage.getItem(SAVED_DECKS_STORAGE_KEY);
      if (rawSavedDecks) {
        const parsedSavedDecks = JSON.parse(rawSavedDecks) as SavedDeck[];
        if (Array.isArray(parsedSavedDecks)) {
          setSavedDecks(parsedSavedDecks);
          if (props.initialDeckId === 'new') {
            setSelectedSavedDeckId('');
            setDeckName('Untitled Deck');
            setSelectedSetId(ALL_SETS_ID);
            setDeck({});
            setView('editor');
          } else if (props.initialDeckId) {
            const initialDeck = parsedSavedDecks.find((savedDeck) => savedDeck.id === props.initialDeckId);
            if (initialDeck) {
              setSelectedSavedDeckId(initialDeck.id);
              setDeckName(initialDeck.name);
              setSelectedSetId(initialDeck.selectedSetId || ALL_SETS_ID);
              setDeck(toDeckMap(initialDeck.entries));
              setView('editor');
            } else {
              setView('library');
            }
          }
        }
      }
    } catch {
      // Ignore corrupted local deck state and keep defaults.
    } finally {
      setIsHydrated(true);
    }
  }, [props.initialDeckId]);

  useEffect(() => {
    let isActive = true;

    const loadSets = async () => {
      setIsLoadingSets(true);
      setError(null);

      try {
        const setOptions = await readSets();
        if (!isActive) {
          return;
        }

        const withAllSets: SetOption[] = [
          {
            id: ALL_SETS_ID,
            name: 'All sets',
            cardCount: setOptions.reduce((sum, set) => sum + set.cardCount, 0),
          },
          ...setOptions,
        ];

        setSets(withAllSets);
        if (withAllSets.length > 0) {
          setSelectedSetId((current) => {
            if (!current) {
              return ALL_SETS_ID;
            }

            const currentExists = withAllSets.some((set) => set.id === current);
            return currentExists ? current : ALL_SETS_ID;
          });
        }
      } catch {
        if (isActive) {
          setError('Failed to load sets from the card catalog.');
        }
      } finally {
        if (isActive) {
          setIsLoadingSets(false);
        }
      }
    };

    void loadSets();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedSetId) {
      return;
    }

    let isActive = true;

    const loadCards = async () => {
      setIsLoadingCards(true);
      setError(null);

      try {
        const { cards: cardsForSet, totalInSet, totalMatched } = await readCardsBySet(selectedSetId, query);
        if (!isActive) {
          return;
        }
        setCards(cardsForSet);
        setTotalCardsInSelectedSet(totalInSet);
        setTotalMatchedCards(totalMatched);
      } catch {
        if (isActive) {
          setError('Failed to load cards for the selected set.');
          setCards([]);
          setTotalCardsInSelectedSet(0);
          setTotalMatchedCards(0);
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
  }, [query, selectedSetId]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const payload: StoredDeck = {
      name: deckName,
      selectedSetId,
      entries: Object.values(deck),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [deck, deckName, isHydrated, selectedSetId]);

  const filteredCards = useMemo(() => cards, [cards]);

  const deckEntries = useMemo(() => {
    return Object.values(deck).sort((a, b) => {
      if (a.category && b.category && a.category !== b.category) {
        return a.category.localeCompare(b.category);
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

  const persistSavedDecks = useCallback((nextSavedDecks: SavedDeck[]) => {
    setSavedDecks(nextSavedDecks);
    localStorage.setItem(SAVED_DECKS_STORAGE_KEY, JSON.stringify(nextSavedDecks));
  }, []);

  const saveDeck = useCallback(() => {
    const normalizedName = deckName.trim() || 'Untitled Deck';
    const now = new Date().toISOString();
    const entries = Object.values(deck);

    const existing = savedDecks.find((savedDeck) => savedDeck.name.toLowerCase() === normalizedName.toLowerCase());
    const nextDeck: SavedDeck = {
      id: existing?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: normalizedName,
      selectedSetId,
      entries,
      savedAt: now,
    };

    const nextSavedDecks = existing
      ? savedDecks.map((savedDeck) => (savedDeck.id === existing.id ? nextDeck : savedDeck))
      : [nextDeck, ...savedDecks];

    persistSavedDecks(nextSavedDecks);
    setSelectedSavedDeckId(nextDeck.id);
    setDeckName(normalizedName);
    toast({ title: `Saved "${normalizedName}"` });
  }, [deck, deckName, persistSavedDecks, savedDecks, selectedSetId, toast]);

  const openSavedDeck = useCallback((savedDeck: SavedDeck) => {
    setSelectedSavedDeckId(savedDeck.id);
    setDeckName(savedDeck.name);
    setSelectedSetId(savedDeck.selectedSetId || ALL_SETS_ID);
    setDeck(toDeckMap(savedDeck.entries));
    setView('editor');
    router.push(`/ptcg/deckbuilder/${savedDeck.id}`);
  }, [router]);

  const startNewDeck = useCallback(() => {
    setSelectedSavedDeckId('');
    setDeckName('Untitled Deck');
    setDeck({});
    setSelectedSetId(ALL_SETS_ID);
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
            importDeckMap[entry.id] = {
              ...entry,
              qty: 1,
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
                        const nextSavedDecks = savedDecks.filter((deckItem) => deckItem.id !== savedDeck.id);
                        persistSavedDecks(nextSavedDecks);
                        if (selectedSavedDeckId === savedDeck.id) {
                          setSelectedSavedDeckId('');
                        }
                        toast({ title: `Deleted "${savedDeck.name}"` });
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
          <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
            <Input
              value={deckName}
              onChange={(event) => setDeckName(event.target.value)}
              placeholder="Deck name"
            />
            <Button onClick={saveDeck}>Save</Button>
            <Button variant="outline" onClick={importFromClipboard} disabled={isImporting}>
              {isImporting ? 'Importing...' : 'Import'}
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

      <UICard className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-base text-slate-100" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <label htmlFor="set-select" className="mb-1 block text-xs text-muted-foreground">
                Set
              </label>
              <select
                id="set-select"
                value={selectedSetId}
                onChange={(event) => setSelectedSetId(event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={isLoadingSets}
              >
                <option value="" disabled>
                  {isLoadingSets ? 'Loading sets...' : 'Select a set'}
                </option>
                {sets.map((set) => (
                  <option key={set.id} value={set.id}>
                    {set.name} ({set.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="card-search" className="mb-1 block text-xs text-muted-foreground">
                Search
              </label>
              <Input
                id="card-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, card id, or local id"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <p className="text-xs text-muted-foreground">
            Showing {filteredCards.length} card{filteredCards.length === 1 ? '' : 's'}
            {query.trim()
              ? ` from ${totalMatchedCards || filteredCards.length} matches (${totalCardsInSelectedSet || cards.length} total in selected scope).`
              : ` from ${totalCardsInSelectedSet || cards.length} available in the selected set.`}
          </p>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {isLoadingCards && <p className="text-sm text-muted-foreground">Loading cards...</p>}

            {!isLoadingCards &&
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
