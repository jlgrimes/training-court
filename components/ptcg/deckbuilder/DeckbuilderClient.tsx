'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Save, Search, Trash2, Upload, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card as UICard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { Database, Json } from '@/database.types';
import { createClient } from '@/utils/supabase/client';
import { MAX_SAVED_DECKLISTS } from './deckbuilder.constants';
import { T, useGT } from 'gt-react';

const STORAGE_KEY = 'ptcg-deckbuilder-v2';
const SAVED_DECKS_BREADCRUMB_STORAGE_KEY = 'ptcg-deckbuilder-saved-v1';
const SAVED_DECKS_BREADCRUMB_EVENT = 'ptcg-deckbuilder-saved-decks-updated';
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
  contentHash: string | null;
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
  contentHash: row.content_hash ?? null,
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

const normalizeDeckNameForComparison = (name: string): string =>
  name.trim().replace(/\s+/g, ' ').toLowerCase();

const formatDecklistName = (name: string): string => {
  return name.replace(/^Pokemon\b/i, 'Pokemon');
};

const normalizeForMatch = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

// Content hashes identify the normalized 60-card list, not a specific saved decklist
// record or card printing. Hash input intentionally uses count + card name + card text
// so alternate arts/sets can still compare as the same list for exact-list statistics.
// Keep this canonicalization stable; changing it will change historical hash meaning.
const normalizeHashText = (value: string): string =>
  normalizeForMatch(value).replace(/\s+/g, ' ');

const canonicalizeDeckForHash = (entries: DeckEntry[]): string => {
  const groupedEntries = entries.reduce<Record<string, { name: string; qty: number; text: string }>>((acc, entry) => {
    const hashEntry = {
      name: normalizeHashText(entry.name),
      qty: entry.qty,
      text: (entry.metadata?.cardText ?? []).map(normalizeHashText).filter(Boolean).join('|'),
    };
    const key = `${hashEntry.name}\u001f${hashEntry.text}`;
    acc[key] = {
      ...hashEntry,
      qty: (acc[key]?.qty ?? 0) + hashEntry.qty,
    };
    return acc;
  }, {});

  return Object.values(groupedEntries)
    .sort((left, right) => {
      const nameCompare = left.name.localeCompare(right.name);
      if (nameCompare !== 0) {
        return nameCompare;
      }

      return left.text.localeCompare(right.text);
    })
    .map((entry) => `${entry.qty} ${entry.name} ${entry.text}`)
    .join('\n');
};

const fallbackHash = (value: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
};

const buildDeckContentHash = async (entries: DeckEntry[]): Promise<string> => {
  const canonicalDeck = canonicalizeDeckForHash(entries);
  if (!globalThis.crypto?.subtle) {
    return fallbackHash(canonicalDeck);
  }

  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalDeck));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

const writeBreadcrumbDeckPreviews = (decks: SavedDeck[]) => {
  const previews = decks.map((deck) => ({
    id: deck.id,
    name: deck.name,
  }));
  localStorage.setItem(SAVED_DECKS_BREADCRUMB_STORAGE_KEY, JSON.stringify(previews));
  window.dispatchEvent(new Event(SAVED_DECKS_BREADCRUMB_EVENT));
};

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
    `Pokemon: ${pokemon.reduce((sum, entry) => sum + entry.qty, 0)}`,
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

  const normalizedSubtypes = (card.metadata.subtypes ?? []).map(normalizeForMatch);
  if (normalizedSubtypes.includes('special')) {
    return false;
  }

  if (normalizedSubtypes.includes('basic')) {
    return true;
  }

  const normalizedName = normalizeForMatch(card.name ?? '')
    .replace(/\{g\}/g, 'grass')
    .replace(/\{r\}/g, 'fire')
    .replace(/\{w\}/g, 'water')
    .replace(/\{l\}/g, 'lightning')
    .replace(/\{p\}/g, 'psychic')
    .replace(/\{f\}/g, 'fighting')
    .replace(/\{d\}/g, 'darkness')
    .replace(/\{m\}/g, 'metal')
    .replace(/\s+/g, ' ');
  const normalizedCategory = normalizeForMatch(card.category ?? '');
  const normalizedSupertype = normalizeForMatch(card.metadata.supertype ?? '');

  if (
    (normalizedCategory === 'energy' || normalizedSupertype === 'energy')
    && !/\bspecial\b/.test(normalizedName)
    && /^(basic\s+)?(grass|fire|water|lightning|psychic|fighting|darkness|metal|fairy)\s+energy$/.test(normalizedName)
  ) {
    return true;
  }

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
  const gt = useGT();
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
  const [view, setView] = useState<DeckbuilderView>(props.initialDeckId ? 'editor' : 'library');
  const [isLoadingInitialDeck, setIsLoadingInitialDeck] = useState(Boolean(props.initialDeckId && props.initialDeckId !== 'new'));
  const [previewCard, setPreviewCard] = useState<CatalogCard | null>(null);
  const [previewSource, setPreviewSource] = useState<PreviewSource>('search');
  const [isImporting, setIsImporting] = useState(false);
  const [isManualImportOpen, setIsManualImportOpen] = useState(false);
  const [manualImportText, setManualImportText] = useState('');
  const [isSavingDeck, setIsSavingDeck] = useState(false);
  const [pendingLinkedSave, setPendingLinkedSave] = useState<{
    tournamentCount: number;
    logCount: number;
  } | null>(null);
  const [pendingDeleteDeck, setPendingDeleteDeck] = useState<{
    deck: SavedDeck;
    tournamentCount: number;
    logCount: number;
  } | null>(null);

  useEffect(() => {
    try {
      if (!props.initialDeckId) {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = normalizeStoredDeck(JSON.parse(raw) as StoredDeck);
          if (parsed.name) {
            setDeckName(parsed.name);
          }
          setDeck(toDeckMap(parsed.entries));
        }
      }

      if (props.initialDeckId === 'new') {
        setIsLoadingInitialDeck(false);
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
        setIsLoadingInitialDeck(false);
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
          setIsLoadingInitialDeck(false);
          setSelectedSavedDeckId(initialDeck.id);
          setDeckName(initialDeck.name);
          setDeck(toDeckMap(initialDeck.entries));
          setView('editor');
        } else {
          setIsLoadingInitialDeck(false);
          setView('library');
        }
      } else {
        setIsLoadingInitialDeck(false);
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
    writeBreadcrumbDeckPreviews(savedDecks);
  }, [savedDecks]);

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

  const getLinkedUsageCounts = useCallback(async (decklistId: string) => {
    const supabase = createClient();
    const [tournamentResult, logResult] = await Promise.all([
      supabase
        .from('tournaments')
        .select('id', { count: 'exact', head: true })
        .eq('user', props.userId)
        .eq('decklist_id', decklistId),
      supabase
        .from('logs')
        .select('id', { count: 'exact', head: true })
        .eq('user', props.userId)
        .eq('decklist_id', decklistId),
    ]);

    return {
      tournamentCount: tournamentResult.count ?? 0,
      logCount: logResult.error ? 0 : logResult.count ?? 0,
    };
  }, [props.userId]);

  const saveDeck = useCallback(async (options?: { acceptLinkedWarning?: boolean; saveAsNew?: boolean }) => {
    const normalizedName = deckName.trim() || 'Untitled Deck';
    const now = new Date().toISOString();
    const entries = Object.values(deck);
    const shouldSaveAsNew = Boolean(options?.saveAsNew);

    if (entries.length === 0) {
      toast({ title: 'Add at least one card before saving.' });
      return;
    }

    const existingById = selectedSavedDeckId && !shouldSaveAsNew
      ? savedDecks.find((savedDeck) => savedDeck.id === selectedSavedDeckId)
      : undefined;
    const nextName = shouldSaveAsNew
      ? getUniqueDeckName(`${normalizedName} Copy`, savedDecks)
      : normalizedName;
    const duplicateName = savedDecks.find((savedDeck) => (
      savedDeck.id !== existingById?.id
      && normalizeDeckNameForComparison(savedDeck.name) === normalizeDeckNameForComparison(nextName)
    ));

    if (duplicateName) {
      toast({
        variant: 'destructive',
        title: 'Decklist name already exists.',
        description: 'Choose a unique name before saving this decklist.',
      });
      return;
    }

    const nextContentHash = await buildDeckContentHash(entries);
    const existingContentHash = existingById
      ? existingById.contentHash ?? await buildDeckContentHash(existingById.entries)
      : null;
    const didDeckContentChange = Boolean(existingById && existingContentHash !== nextContentHash);

    setIsSavingDeck(true);
    const supabase = createClient();

    const linkedUsage = existingById && didDeckContentChange
      ? await getLinkedUsageCounts(existingById.id)
      : null;
    const tournamentCount = linkedUsage?.tournamentCount ?? 0;
    const logCount = linkedUsage?.logCount ?? 0;
    const hasLinkedStats = tournamentCount + logCount > 0;

    if (existingById && didDeckContentChange && hasLinkedStats && !options?.acceptLinkedWarning) {
      setIsSavingDeck(false);
      setPendingLinkedSave({ tournamentCount, logCount });
      return;
    }

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
      content_hash: nextContentHash,
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
      ? [nextDeck, ...savedDecks.filter((savedDeck) => savedDeck.id !== existingById.id && savedDeck.id !== nextDeck.id)]
      : [nextDeck, ...savedDecks];

    setPendingLinkedSave(null);
    setSavedDecks(nextSavedDecks);
    setSelectedSavedDeckId(nextDeck.id);
    setDeckName(nextName);
    router.replace(`/ptcg/deckbuilder/${nextDeck.id}`);
    toast({ title: `Saved "${nextName}"` });
  }, [deck, deckName, getLinkedUsageCounts, props.userId, router, savedDecks, selectedSavedDeckId, toast]);

  const openSavedDeck = useCallback((savedDeck: SavedDeck) => {
    setPendingLinkedSave(null);
    router.push(`/ptcg/deckbuilder/${savedDeck.id}`);
  }, [router]);

  const deleteSavedDeck = useCallback(async (savedDeck: SavedDeck, options?: { acceptLinkedWarning?: boolean }) => {
    const usage = await getLinkedUsageCounts(savedDeck.id);
    const hasLinkedStats = usage.tournamentCount + usage.logCount > 0;
    if (hasLinkedStats && !options?.acceptLinkedWarning) {
      setPendingDeleteDeck({
        deck: savedDeck,
        tournamentCount: usage.tournamentCount,
        logCount: usage.logCount,
      });
      return;
    }

    const supabase = createClient();

    if (hasLinkedStats) {
      const [tournamentUnlinkResult, logUnlinkResult] = await Promise.all([
        supabase
          .from('tournaments')
          .update({ decklist_id: null })
          .eq('user', props.userId)
          .eq('decklist_id', savedDeck.id),
        supabase
          .from('logs')
          .update({ decklist_id: null })
          .eq('user', props.userId)
          .eq('decklist_id', savedDeck.id),
      ]);
      const unlinkError = tournamentUnlinkResult.error ?? logUnlinkResult.error;

      if (unlinkError) {
        toast({
          variant: 'destructive',
          title: 'Unable to remove decklist associations.',
          description: unlinkError.message,
        });
        return;
      }
    }

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
    setPendingDeleteDeck(null);
  }, [getLinkedUsageCounts, props.userId, savedDecks, selectedSavedDeckId, toast]);

  const startNewDeck = useCallback(() => {
    setSelectedSavedDeckId('');
    setDeckName('Untitled Deck');
    setDeck({});
    setView('editor');
    router.push('/ptcg/deckbuilder/new');
  }, [router]);

  const isOverLimit = totalCards > MAX_DECK_SIZE;

  const importDecklistText = useCallback(async (decklistText: string) => {
    const trimmedDecklistText = decklistText.trim();
    if (!trimmedDecklistText) {
      toast({ title: 'Clipboard is empty.' });
      return false;
    }

    setIsImporting(true);

    try {
      const response = await fetch('/api/ptcg/cards/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ decklist: trimmedDecklistText }),
      });

      const payload = (await response.json()) as ImportResponse;
      if (!response.ok) {
        toast({
          variant: 'destructive',
          title: 'Unable to import decklist.',
          description: (payload as { message?: string }).message ?? 'Check the decklist format and try again.',
        });
        return false;
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
      return true;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Unable to import decklist.',
        description: error instanceof Error ? error.message : 'Check the decklist format and try again.',
      });
      return false;
    } finally {
      setIsImporting(false);
    }
  }, [toast]);

  const importFromClipboard = useCallback(async () => {
    let clipboardText = '';

    try {
      clipboardText = await navigator.clipboard.readText();
    } catch {
      setManualImportText('');
      setIsManualImportOpen(true);
      return;
    }

    await importDecklistText(clipboardText);
  }, [importDecklistText]);

  const submitManualImport = useCallback(async () => {
    const didImport = await importDecklistText(manualImportText);
    if (didImport) {
      setIsManualImportOpen(false);
      setManualImportText('');
    }
  }, [importDecklistText, manualImportText]);

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
      <>
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
                  </button>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => openSavedDeck(savedDeck)}
                      className="min-w-0 text-left"
                    >
                      <p className="truncate text-sm font-semibold">{savedDeck.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Last Saved {new Date(savedDeck.savedAt).toLocaleString()}
                      </p>
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${savedDeck.name}`}
                      className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={() => {
                        void deleteSavedDeck(savedDeck);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {savedDecks.length === 0 && (
              <p className="text-sm text-muted-foreground">No saved decks yet. Use New Deck to get started.</p>
            )}
          </CardContent>
        </UICard>

        <Dialog open={Boolean(pendingDeleteDeck)} onOpenChange={(open) => {
          if (!open) {
            setPendingDeleteDeck(null);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete linked decklist?</DialogTitle>
              <DialogDescription>
                This decklist is tied to {pendingDeleteDeck?.tournamentCount ?? 0} tournament(s)
                {pendingDeleteDeck?.logCount ? ` and ${pendingDeleteDeck.logCount} log(s)` : ''}. Deleting it will remove the saved
                list and remove its decklist association from existing logs and tournaments.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPendingDeleteDeck(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (pendingDeleteDeck) {
                    void deleteSavedDeck(pendingDeleteDeck.deck, { acceptLinkedWarning: true });
                  }
                }}
              >
                Delete anyway
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (isLoadingInitialDeck) {
    return (
      <div className="grid gap-4 lg:grid-cols-8" aria-busy="true" aria-label="Loading decklist">
        <UICard className="lg:col-span-5">
          <CardContent className="space-y-4 pt-4">
            <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto]">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-20" />
            </div>
            <Skeleton className="h-5 w-28" />
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5 md:grid-cols-6 xl:grid-cols-8">
              {Array.from({ length: 24 }).map((_, index) => (
                <Skeleton key={index} className="aspect-[5/7] w-full rounded-md" />
              ))}
            </div>
          </CardContent>
        </UICard>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-8">
      <UICard className="lg:col-span-5">
        <CardContent className="space-y-4 pt-4">
          <TooltipProvider delayDuration={250}>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto]">
              <Input
                className="col-span-4 sm:col-span-1"
                value={deckName}
                onChange={(event) => setDeckName(event.target.value)}
                placeholder="Deck name"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Save"
                    className="w-full gap-2 px-0 sm:w-auto sm:px-4"
                    onClick={() => void saveDeck()}
                    disabled={deckEntries.length === 0 || isSavingDeck}
                  >
                    <Save className="h-4 w-4" />
                    <span className="hidden sm:inline">{isSavingDeck ? 'Saving...' : 'Save'}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save deck</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Import"
                    className="w-full gap-2 px-0 sm:w-auto sm:px-4"
                    variant="outline"
                    onClick={importFromClipboard}
                    disabled={isImporting}
                  >
                    <Upload className="h-4 w-4" />
                    <span className="hidden sm:inline">{isImporting ? 'Importing...' : 'Import'}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Import decklist</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Export"
                    className="w-full gap-2 px-0 sm:w-auto sm:px-4"
                    variant="outline"
                    onClick={exportToClipboard}
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export decklist</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Clear"
                    className="w-full gap-2 px-0 sm:w-auto sm:px-4"
                    variant="outline"
                    onClick={clearDeck}
                  >
                    <XCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Clear</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear deck</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

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
                      <div className="absolute bottom-[7%] left-1/2 flex h-7 min-w-7 -translate-x-1/2 items-center justify-center rounded-full bg-black/85 px-1.5 text-sm font-extrabold leading-none text-white shadow sm:h-9 sm:min-w-9 sm:px-2 sm:text-lg lg:h-12 lg:min-w-12 lg:px-3 lg:text-2xl">
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
        <CardContent className="flex min-h-0 flex-1 flex-col space-y-4">
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
                placeholder="Search by name"
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

      <Dialog open={Boolean(pendingLinkedSave)} onOpenChange={(open) => {
        if (!open) {
          setPendingLinkedSave(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save linked decklist?</DialogTitle>
            <DialogDescription>
              This list is already tied to {pendingLinkedSave?.tournamentCount ?? 0} tournament(s)
              {pendingLinkedSave?.logCount ? ` and ${pendingLinkedSave.logCount} log(s)` : ''}. Saving card changes will update
              this same decklist, so those existing stats will now point at the edited list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingLinkedSave(null)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => void saveDeck({ saveAsNew: true })}
              disabled={isSavingDeck}
            >
              {isSavingDeck ? 'Saving...' : 'Create as new deck'}
            </Button>
            <Button onClick={() => void saveDeck({ acceptLinkedWarning: true })} disabled={isSavingDeck}>
              {isSavingDeck ? 'Saving...' : 'Save anyway'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isManualImportOpen} onOpenChange={setIsManualImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <T id="deckbuilder.import.manual.title">Paste decklist</T>
            </DialogTitle>
            <DialogDescription>
              <T id="deckbuilder.import.manual.description">
                Clipboard access is blocked on this device. Paste your decklist here to import it.
              </T>
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={manualImportText}
            onChange={(event) => setManualImportText(event.target.value)}
            className="min-h-64"
            placeholder={gt('Paste decklist text', { $id: 'deckbuilder.import.manual.placeholder' })}
            aria-label={gt('Decklist text', { $id: 'deckbuilder.import.manual.textareaLabel' })}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManualImportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void submitManualImport()} disabled={isImporting}>
              <T id="deckbuilder.import.manual.submit">Import decklist</T>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(pendingDeleteDeck)} onOpenChange={(open) => {
        if (!open) {
          setPendingDeleteDeck(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete linked decklist?</DialogTitle>
            <DialogDescription>
              This decklist is tied to {pendingDeleteDeck?.tournamentCount ?? 0} tournament(s)
              {pendingDeleteDeck?.logCount ? ` and ${pendingDeleteDeck.logCount} log(s)` : ''}. Deleting it will remove the saved
              list and remove its decklist association from existing logs and tournaments.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDeleteDeck(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingDeleteDeck) {
                  void deleteSavedDeck(pendingDeleteDeck.deck, { acceptLinkedWarning: true });
                }
              }}
            >
              Delete anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
