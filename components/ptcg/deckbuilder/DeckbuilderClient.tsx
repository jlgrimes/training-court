'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TCGdex, { type CardResume, type SetResume } from '@tcgdex/sdk';

import { Button } from '@/components/ui/button';
import { Card as UICard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const tcgdex = new TCGdex('en');

const STORAGE_KEY = 'ptcg-deckbuilder-v1';
const MAX_DECK_SIZE = 60;

type DeckEntry = {
  id: string;
  localId: string;
  name: string;
  image?: string;
  qty: number;
  category?: string;
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
};

const buildImageUrl = (image?: string): string | undefined => {
  if (!image) {
    return undefined;
  }
  return `${image}/low.png`;
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
  const [cards, setCards] = useState<Array<CardResume>>([]);
  const [isLoadingSets, setIsLoadingSets] = useState(true);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deckName, setDeckName] = useState('Untitled Deck');
  const [query, setQuery] = useState('');
  const [deck, setDeck] = useState<Record<string, DeckEntry>>({});
  const [isHydrated, setIsHydrated] = useState(false);

  const categoryCacheRef = useRef<Record<string, string>>({});
  const inFlightCategoryFetchesRef = useRef<Set<string>>(new Set());

  const hydrateCardCategory = useCallback(async (cardId: string) => {
    if (categoryCacheRef.current[cardId]) {
      return;
    }

    if (inFlightCategoryFetchesRef.current.has(cardId)) {
      return;
    }

    inFlightCategoryFetchesRef.current.add(cardId);
    try {
      const card = await tcgdex.fetch('cards', cardId);
      if (!card?.category) {
        return;
      }

      categoryCacheRef.current[cardId] = card.category;
      setDeck((prev) => {
        const existing = prev[cardId];
        if (!existing || existing.category === card.category) {
          return prev;
        }
        return {
          ...prev,
          [cardId]: {
            ...existing,
            category: card.category,
          },
        };
      });
    } finally {
      inFlightCategoryFetchesRef.current.delete(cardId);
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredDeck;
        if (parsed.name) {
          setDeckName(parsed.name);
        }
        if (parsed.selectedSetId) {
          setSelectedSetId(parsed.selectedSetId);
        }
        if (Array.isArray(parsed.entries)) {
          setDeck(toDeckMap(parsed.entries));
          parsed.entries.forEach((entry) => {
            if (entry.category) {
              categoryCacheRef.current[entry.id] = entry.category;
            }
          });
        }
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
        const data = await tcgdex.fetch('sets');
        if (!isActive) {
          return;
        }

        const setList = data ?? [];
        const setDetails = await Promise.allSettled(
          setList.map((set) => tcgdex.fetch('sets', set.id))
        );

        const releaseDateBySetId = new Map<string, string>();
        setDetails.forEach((result) => {
          if (result.status !== 'fulfilled') {
            return;
          }

          const set = result.value;
          if (set?.id && set.releaseDate) {
            releaseDateBySetId.set(set.id, set.releaseDate);
          }
        });

        const setOptions: Array<SetOption> = setList
          .map((set: SetResume) => ({
            id: set.id,
            name: set.name,
            releaseDate: releaseDateBySetId.get(set.id),
          }))
          .sort((a, b) => {
            const aTime = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
            const bTime = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
            return bTime - aTime;
          });

        setSets(setOptions);

        if (setOptions.length > 0) {
          setSelectedSetId((current) => current || setOptions[0].id);
        }
      } catch {
        if (isActive) {
          setError('Failed to load sets from TCGdex.');
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
        const data = await tcgdex.fetchCards(selectedSetId);
        if (!isActive) {
          return;
        }
        const sortedCards = (data ?? []).slice().sort((a, b) =>
          a.localId.localeCompare(b.localId, undefined, { numeric: true, sensitivity: 'base' })
        );
        setCards(sortedCards);
      } catch {
        if (isActive) {
          setError('Failed to load cards for the selected set.');
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
  }, [selectedSetId]);

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

  const filteredCards = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return cards.slice(0, 100);
    }

    return cards
      .filter((card) => {
        return (
          card.name.toLowerCase().includes(normalizedQuery) ||
          card.id.toLowerCase().includes(normalizedQuery) ||
          card.localId.toLowerCase().includes(normalizedQuery)
        );
      })
      .slice(0, 100);
  }, [cards, query]);

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

  const addCard = useCallback((card: CardResume) => {
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
          image: card.image,
          qty: 1,
          category: categoryCacheRef.current[card.id],
        },
      };
    });

    void hydrateCardCategory(card.id);
  }, [hydrateCardCategory]);

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
                  {buildImageUrl(entry.image) ? (
                    <img
                      src={buildImageUrl(entry.image)}
                      alt={entry.name}
                      className="h-12 w-9 rounded object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-12 w-9 rounded bg-muted" />
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{entry.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {entry.category ?? 'Loading category...'}
                    </div>
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
                        image: entry.image,
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
            Showing {filteredCards.length} card{filteredCards.length === 1 ? '' : 's'} from the selected set.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {isLoadingCards && <p className="text-sm text-muted-foreground">Loading cards...</p>}

            {!isLoadingCards &&
              filteredCards.map((card) => (
                <div key={card.id} className="rounded-md border border-border p-2">
                  <div className="mb-2">
                    {buildImageUrl(card.image) ? (
                      <img
                        src={buildImageUrl(card.image)}
                        alt={card.name}
                        className="h-44 w-full rounded object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-44 w-full rounded bg-muted" />
                    )}
                  </div>
                  <div className="mb-2">
                    <p className="truncate text-sm font-medium">{card.name}</p>
                    <p className="text-xs text-muted-foreground">{card.id}</p>
                  </div>
                  <Button className="w-full" onClick={() => addCard(card)}>
                    Add to Deck
                  </Button>
                </div>
              ))}
          </div>
        </CardContent>
      </UICard>
    </div>
  );
}
