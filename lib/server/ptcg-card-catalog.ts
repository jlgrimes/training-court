const CARD_DATA_SOURCE_URL = 'https://dillonzer.github.io/data/cards.json';
const CATALOG_TTL_MS = 30 * 60 * 1000;
const CATALOG_CACHE_VERSION = 2;

type JsonObject = Record<string, unknown>;

export type DeckbuilderCardMetadata = {
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

export type DeckbuilderCatalogCard = {
  id: string;
  name: string;
  localId: string;
  imageUrlHiRes?: string;
  imageUrl?: string;
  category: string;
  metadata: DeckbuilderCardMetadata;
};

export type DeckbuilderCatalogSet = {
  id: string;
  name: string;
  releaseDate?: string;
  cardCount: number;
};

type DeckbuilderCatalog = {
  sets: DeckbuilderCatalogSet[];
  cardsBySet: Map<string, DeckbuilderCatalogCard[]>;
  allCards: DeckbuilderCatalogCard[];
};

type CatalogCache = {
  data: DeckbuilderCatalog | null;
  loadedAt: number;
  inFlight: Promise<DeckbuilderCatalog> | null;
  version: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __ptcgDeckbuilderCatalogCache: CatalogCache | undefined;
}

const getCache = (): CatalogCache => {
  if (!globalThis.__ptcgDeckbuilderCatalogCache) {
    globalThis.__ptcgDeckbuilderCatalogCache = {
      data: null,
      loadedAt: 0,
      inFlight: null,
      version: CATALOG_CACHE_VERSION,
    };
  } else if (globalThis.__ptcgDeckbuilderCatalogCache.version !== CATALOG_CACHE_VERSION) {
    globalThis.__ptcgDeckbuilderCatalogCache = {
      data: null,
      loadedAt: 0,
      inFlight: null,
      version: CATALOG_CACHE_VERSION,
    };
  }

  return globalThis.__ptcgDeckbuilderCatalogCache;
};

const asObject = (value: unknown): JsonObject | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as JsonObject;
};

const toString = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return undefined;
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => toString(entry))
    .filter((entry): entry is string => Boolean(entry));
};

const parseWeaknessLike = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      const item = asObject(entry);
      if (!item) {
        return toString(entry);
      }

      const type = toString(item.type);
      const amount = toString(item.value);
      if (type && amount) {
        return `${type} ${amount}`;
      }
      return type ?? amount;
    })
    .filter((entry): entry is string => Boolean(entry));
};

const parseRetreatCost = (value: unknown): string[] => {
  return toStringArray(value);
};

const parseCardCategory = (card: JsonObject): string => {
  const supertype = toString(card.supertype) ?? toString(card.category);
  if (supertype) {
    return supertype;
  }

  const types = toStringArray(card.types);
  if (types.includes('Energy')) {
    return 'Energy';
  }

  return 'Unknown';
};

const parseEnergyKind = (card: JsonObject): 'Basic' | 'Special' | undefined => {
  const subtypes = toStringArray(card.subtypes).map((value) => value.toLowerCase());
  if (subtypes.includes('basic')) {
    return 'Basic';
  }
  if (subtypes.includes('special')) {
    return 'Special';
  }
  return undefined;
};

const parseCardText = (card: JsonObject): string[] => {
  const textEntries = toStringArray(card.text);
  const attackEntries = Array.isArray(card.attacks)
    ? card.attacks
        .map((attack) => asObject(attack))
        .filter((attack): attack is JsonObject => Boolean(attack))
        .flatMap((attack) => {
          const name = toString(attack.name);
          const text = toString(attack.text);
          if (name && text) {
            return [`${name}: ${text}`];
          }
          return [name ?? text].filter((entry): entry is string => Boolean(entry));
        })
    : [];

  return [...textEntries, ...attackEntries];
};

const parseSetData = (card: JsonObject) => {
  const fallbackCardId = toString(card.id);
  const setNameFromCardId = fallbackCardId?.includes('-')
    ? fallbackCardId.split('-').slice(0, -1).join('-')
    : undefined;

  const set = asObject(card.set);
  if (!set) {
    const setCode = toString(card.setCode) ?? setNameFromCardId ?? 'unknown';
    return {
      setId: setCode,
      setPtcgoCode: undefined,
      setName: toString(card.setName) ?? setNameFromCardId ?? setCode ?? 'Unknown Set',
      setSeries: undefined,
      releaseDate: undefined,
    };
  }

  const setCode = toString(set.id) ?? toString(set.code) ?? toString(set.ptcgoCode) ?? toString(card.setCode);
  const setName = toString(set.name) ?? toString(card.setName) ?? setNameFromCardId ?? setCode ?? 'Unknown Set';

  return {
    setId: setCode ?? 'unknown',
    setPtcgoCode: toString(set.ptcgoCode),
    setName,
    setSeries: toString(set.series),
    releaseDate: toString(set.releaseDate),
  };
};

const parseLegalityIcon = (card: JsonObject): string | undefined => {
  const legalities = asObject(card.legalities);
  if (!legalities) {
    return undefined;
  }

  const standard = toString(legalities.standard);
  if (standard) {
    return `Standard: ${standard}`;
  }

  const expanded = toString(legalities.expanded);
  if (expanded) {
    return `Expanded: ${expanded}`;
  }

  return undefined;
};

const parseCardId = (card: JsonObject, setId: string, localId: string, name: string): string => {
  const directId = toString(card.id);
  if (directId) {
    return directId;
  }

  const number = toString(card.number);
  if (number) {
    return `${setId}-${number}`;
  }

  return `${setId}-${localId}-${name.toLowerCase().replace(/\s+/g, '-')}`;
};

const parseCard = (rawCard: unknown): (DeckbuilderCatalogCard & { setId: string; releaseDate?: string; setName: string }) | null => {
  const card = asObject(rawCard);
  if (!card) {
    return null;
  }

  const name = toString(card.name);
  if (!name) {
    return null;
  }

  const setData = parseSetData(card);
  const localId = toString(card.number) ?? toString(card.localId) ?? '';
  const cardId = parseCardId(card, setData.setId, localId, name);
  const images = asObject(card.images);

  const imageUrlHiRes =
    toString(card.imageUrlHiRes) ??
    toString(images?.large) ??
    toString(card.imageUrl) ??
    toString(images?.small);
  const imageUrl = toString(card.imageUrl) ?? toString(images?.small) ?? imageUrlHiRes;

  const rules = toStringArray(card.rules);

  return {
    id: cardId,
    name,
    localId: localId || cardId,
    imageUrlHiRes,
    imageUrl,
    category: parseCardCategory(card),
    metadata: {
      hp: toString(card.hp),
      supertype: toString(card.supertype) ?? toString(card.category),
      setId: setData.setId,
      setCode: setData.setPtcgoCode,
      setName: setData.setName,
      setSeries: setData.setSeries,
      setReleaseDate: setData.releaseDate,
      subtypes: toStringArray(card.subtypes),
      energyKind: parseEnergyKind(card),
      number: toString(card.number) ?? localId,
      cardText: parseCardText(card),
      weakness: parseWeaknessLike(card.weaknesses),
      resistance: parseWeaknessLike(card.resistances),
      retreatCost: parseRetreatCost(card.retreatCost),
      legalityIcon: parseLegalityIcon(card),
      rarity: toString(card.rarity),
      rulebox: rules,
    },
    setId: setData.setId,
    setName: setData.setName,
    releaseDate: setData.releaseDate,
  };
};

const compareLocalIds = (a: string, b: string): number => {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
};

const resolveRawCards = (rawData: unknown): unknown[] => {
  if (Array.isArray(rawData)) {
    return rawData;
  }

  const root = asObject(rawData);
  if (!root) {
    return [];
  }

  const cards = root.cards;
  if (Array.isArray(cards)) {
    return cards;
  }

  const data = root.data;
  if (Array.isArray(data)) {
    return data;
  }

  return [];
};

const buildCatalog = (rawData: unknown): DeckbuilderCatalog => {
  const rawCards = resolveRawCards(rawData);
  const setsById = new Map<string, DeckbuilderCatalogSet>();
  const cardsBySet = new Map<string, DeckbuilderCatalogCard[]>();
  const allCards: DeckbuilderCatalogCard[] = [];

  for (const rawCard of rawCards) {
    const parsed = parseCard(rawCard);
    if (!parsed) {
      continue;
    }

    const existingSet = setsById.get(parsed.setId);
    if (!existingSet) {
      setsById.set(parsed.setId, {
        id: parsed.setId,
        name: parsed.setName,
        releaseDate: parsed.releaseDate,
        cardCount: 1,
      });
    } else {
      existingSet.cardCount += 1;
      if (!existingSet.releaseDate && parsed.releaseDate) {
        existingSet.releaseDate = parsed.releaseDate;
      }
    }

    const deckCard: DeckbuilderCatalogCard = {
      id: parsed.id,
      name: parsed.name,
      localId: parsed.localId,
      imageUrlHiRes: parsed.imageUrlHiRes,
      imageUrl: parsed.imageUrl,
      category: parsed.category,
      metadata: parsed.metadata,
    };

    const currentSetCards = cardsBySet.get(parsed.setId);
    if (!currentSetCards) {
      cardsBySet.set(parsed.setId, [deckCard]);
    } else {
      currentSetCards.push(deckCard);
    }

    allCards.push(deckCard);
  }

  const sets = Array.from(setsById.values()).sort((a, b) => {
    const aTime = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
    const bTime = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
    if (aTime !== bTime) {
      return bTime - aTime;
    }
    return a.name.localeCompare(b.name);
  });

  Array.from(cardsBySet.values()).forEach((cardsInSet) => {
    cardsInSet.sort((leftCard, rightCard) => compareLocalIds(leftCard.localId, rightCard.localId));
  });

  return {
    sets,
    cardsBySet,
    allCards,
  };
};

const fetchCatalog = async (): Promise<DeckbuilderCatalog> => {
  const response = await fetch(CARD_DATA_SOURCE_URL, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch card catalog (${response.status})`);
  }

  const payload = (await response.json()) as unknown;
  return buildCatalog(payload);
};

const shouldReload = (loadedAt: number): boolean => {
  if (!loadedAt) {
    return true;
  }
  return Date.now() - loadedAt > CATALOG_TTL_MS;
};

export async function getDeckbuilderCardCatalog(): Promise<DeckbuilderCatalog> {
  const cache = getCache();

  if (cache.data && !shouldReload(cache.loadedAt)) {
    return cache.data;
  }

  if (cache.inFlight) {
    return cache.inFlight;
  }

  cache.inFlight = (async () => {
    try {
      const catalog = await fetchCatalog();
      cache.data = catalog;
      cache.loadedAt = Date.now();
      return catalog;
    } catch (error) {
      if (cache.data) {
        return cache.data;
      }
      throw error;
    } finally {
      cache.inFlight = null;
    }
  })();

  return cache.inFlight;
}

export async function getDeckbuilderSets(): Promise<DeckbuilderCatalogSet[]> {
  const catalog = await getDeckbuilderCardCatalog();
  return catalog.sets;
}

export async function getDeckbuilderCardsBySet(setId: string): Promise<DeckbuilderCatalogCard[]> {
  const catalog = await getDeckbuilderCardCatalog();
  return catalog.cardsBySet.get(setId) ?? [];
}

export async function getAllDeckbuilderCards(): Promise<DeckbuilderCatalogCard[]> {
  const catalog = await getDeckbuilderCardCatalog();
  if (Array.isArray(catalog.allCards)) {
    return catalog.allCards;
  }

  return Array.from(catalog.cardsBySet.values()).flat();
}
