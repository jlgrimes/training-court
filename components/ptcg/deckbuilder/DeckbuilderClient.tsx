'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card as UICard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const STORAGE_KEY = 'ptcg-deckbuilder-v2';
const MAX_DECK_SIZE = 60;
const ALL_SETS_ID = 'all';

type CardMetadata = {
  hp?: string;
  setId?: string;
  setName?: string;
  setSeries?: string;
  setReleaseDate?: string;
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

type StoredDeck = {
  name: string;
  selectedSetId: string;
  entries: Array<DeckEntry>;
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

export function DeckbuilderClient() {
  const [sets, setSets] = useState<Array<SetOption>>([]);
  const [selectedSetId, setSelectedSetId] = useState('');
  const [cards, setCards] = useState<Array<CatalogCard>>([]);
  const [totalCardsInSelectedSet, setTotalCardsInSelectedSet] = useState(0);
  const [totalMatchedCards, setTotalMatchedCards] = useState(0);
  const [isLoadingSets, setIsLoadingSets] = useState(true);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deckName, setDeckName] = useState('Untitled Deck');
  const [query, setQuery] = useState('');
  const [deck, setDeck] = useState<Record<string, DeckEntry>>({});
  const [isHydrated, setIsHydrated] = useState(false);

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
    } catch {
      // Ignore corrupted local deck state and keep defaults.
    } finally {
      setIsHydrated(true);
    }
  }, []);

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

  const pokemonCount = useMemo(() => {
    return deckEntries
      .filter((entry) => entry.category === 'Pokemon')
      .reduce((sum, entry) => sum + entry.qty, 0);
  }, [deckEntries]);

  const trainerCount = useMemo(() => {
    return deckEntries
      .filter((entry) => entry.category === 'Trainer')
      .reduce((sum, entry) => sum + entry.qty, 0);
  }, [deckEntries]);

  const energyCount = useMemo(() => {
    return deckEntries
      .filter((entry) => entry.category === 'Energy')
      .reduce((sum, entry) => sum + entry.qty, 0);
  }, [deckEntries]);

  const addCard = useCallback((card: CatalogCard) => {
    setDeck((prev) => {
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

  const clearDeck = useCallback(() => {
    setDeck({});
  }, []);

  const isOverLimit = totalCards > MAX_DECK_SIZE;

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <UICard className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base text-slate-100">Deck</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={deckName}
            onChange={(event) => setDeckName(event.target.value)}
            placeholder="Deck name"
          />

          <div className="text-sm text-muted-foreground">
            <div className={isOverLimit ? 'text-red-400 font-semibold' : undefined}>
              Cards: {totalCards}/{MAX_DECK_SIZE}
            </div>
            <div>Pokemon: {pokemonCount}</div>
            <div>Trainers: {trainerCount}</div>
            <div>Energy: {energyCount}</div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
            {deckEntries.length === 0 && (
              <p className="text-sm text-muted-foreground">No cards in deck yet.</p>
            )}

            {deckEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border p-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {buildImageUrl(entry.imageUrlHiRes, entry.imageUrl) ? (
                    <img
                      src={buildImageUrl(entry.imageUrlHiRes, entry.imageUrl)}
                      alt={entry.name}
                      className="h-12 w-9 rounded object-contain bg-muted"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-12 w-9 rounded bg-muted" />
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{entry.name}</div>
                    <div className="text-xs text-muted-foreground">{entry.category ?? 'Unknown'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" onClick={() => decrementCard(entry.id)}>
                    -
                  </Button>
                  <span className="w-6 text-center text-sm">{entry.qty}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      addCard({
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
                      })
                    }
                  >
                    +
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" onClick={clearDeck}>
            Clear Deck
          </Button>
        </CardContent>
      </UICard>

      <UICard className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-base text-slate-100">Card Search</CardTitle>
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
                  className="rounded-md border border-border p-2 cursor-pointer transition-colors hover:bg-muted/30 focus-within:bg-muted/30"
                  role="button"
                  tabIndex={0}
                  onClick={() => addCard(card)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      addCard(card);
                    }
                  }}
                >
                  <div className="mb-2">
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
                  <div className="mb-2">
                    <p className="truncate text-sm font-medium">{card.name}</p>
                    <p className="text-xs text-muted-foreground">{card.id}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Click card to add</p>
                </div>
              ))}
          </div>
        </CardContent>
      </UICard>
    </div>
  );
}
