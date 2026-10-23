import { replayCatalogSetIds } from '@/lib/ptcg/replay-card-lookup';
import {
  getAllDeckbuilderCards,
  getDeckbuilderCardsBySet,
  type DeckbuilderCatalogCard,
} from '@/lib/server/ptcg-card-catalog';
import { normalizeCardNameForLookup } from '@/lib/ptcg/card-name';

// This printing is absent from the upstream catalog.
// Artwork: https://limitlesstcg.com/cards/en/SVE/21
const supplementalReplayCards: DeckbuilderCatalogCard[] = [{
  id: 'sve_21', localId: '21', name: 'Basic Psychic Energy', category: 'Energy',
  imageUrl: '/images/replay/sve-021.png', imageUrlHiRes: '/images/replay/sve-021.png',
  metadata: {
    setId: 'sve', setCode: 'SVE', setName: 'Scarlet & Violet Energy', number: '21',
    energyKind: 'Basic', cardText: [], weakness: [], resistance: [], retreatCost: [], rulebox: [],
  },
}, {
  // Live's alternate-art identifier; the physical card is SVE 005.
  // Artwork: https://images.pokedata.ovh/en/svalt/116_hires.webp
  id: 'svalt_116', localId: '116', name: 'Basic Psychic Energy', category: 'Energy',
  imageUrl: '/images/replay/svalt-116.webp', imageUrlHiRes: '/images/replay/svalt-116.webp',
  metadata: {
    setId: 'svalt', number: '116', energyKind: 'Basic',
    cardText: [], weakness: [], resistance: [], retreatCost: [], rulebox: [],
  },
}];

const DEFAULT_LIMIT = 400;
const MAX_LIMIT = 1200;
type CardSort = 'recent' | 'name-asc' | 'name-desc';

const asTimestamp = (value?: string): number => {
  if (!value) {
    return 0;
  }
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
};

const compareBySort = (sort: CardSort) => {
  return (left: DeckbuilderCatalogCard, right: DeckbuilderCatalogCard) => {
    if (sort === 'name-asc') {
      const byName = left.name.localeCompare(right.name, undefined, { sensitivity: 'base' });
      if (byName !== 0) {
        return byName;
      }
      return left.localId.localeCompare(right.localId, undefined, { numeric: true, sensitivity: 'base' });
    }

    if (sort === 'name-desc') {
      const byName = right.name.localeCompare(left.name, undefined, { sensitivity: 'base' });
      if (byName !== 0) {
        return byName;
      }
      return right.localId.localeCompare(left.localId, undefined, { numeric: true, sensitivity: 'base' });
    }

    const leftRelease = asTimestamp(left.metadata.setReleaseDate);
    const rightRelease = asTimestamp(right.metadata.setReleaseDate);
    if (leftRelease !== rightRelease) {
      return rightRelease - leftRelease;
    }

    const byName = left.name.localeCompare(right.name, undefined, { sensitivity: 'base' });
    if (byName !== 0) {
      return byName;
    }

    return left.localId.localeCompare(right.localId, undefined, { numeric: true, sensitivity: 'base' });
  };
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const setId = searchParams.get('setId')?.trim();
    const query = normalizeCardNameForLookup(searchParams.get('query') ?? '');
    const identifier = searchParams.get('identifier')?.trim().toLowerCase();
    const identifierParts = identifier?.match(/^([^_]+)_([^_]+)(?:_(?:ph|mph))?$/);
    const normalizeNumber = (value: string) => value.toLowerCase().replace(/^0+(?=\d)/, '');
    const exactName = searchParams.get('exactName') === 'true';
    const rawLimit = Number(searchParams.get('limit'));
    const limit = Number.isFinite(rawLimit)
      ? Math.max(1, Math.min(MAX_LIMIT, Math.floor(rawLimit)))
      : DEFAULT_LIMIT;
    const sortParam = searchParams.get('sort')?.trim().toLowerCase() as CardSort | null;
    const sort: CardSort = sortParam === 'name-asc' || sortParam === 'name-desc' || sortParam === 'recent' ? sortParam : 'recent';

    // Local artwork must remain available when the remote catalog is unavailable.
    const supplementalMatches = identifier ? supplementalReplayCards.filter((card) => {
      if (query && normalizeCardNameForLookup(card.name) !== query) return false;
      if (card.id.toLowerCase() === identifier) return true;
      return !!identifierParts && replayCatalogSetIds(card.metadata).includes(identifierParts[1])
        && normalizeNumber(card.localId) === normalizeNumber(identifierParts[2]);
    }) : [];
    if (supplementalMatches.length > 0) {
      return Response.json({
        cards: supplementalMatches.slice(0, limit), totalInSet: supplementalMatches.length,
        totalMatched: supplementalMatches.length, returned: Math.min(limit, supplementalMatches.length), sort, code: 200,
      });
    }

    const isAllSets = !setId || setId === 'all';
    const setCards = isAllSets
      ? await getAllDeckbuilderCards()
      : await getDeckbuilderCardsBySet(setId);
    const safeSetCards = Array.isArray(setCards) ? setCards : [];
    const filteredCards = identifier
      ? safeSetCards.filter((card) => {
          // A supplied name validates the exact printing; it is never a fallback.
          if (query && normalizeCardNameForLookup(card.name) !== query) return false;
          if (card.id.toLowerCase() === identifier) return true;
          if (!identifierParts) return false;
          const [, set, number] = identifierParts;
          return replayCatalogSetIds(card.metadata).includes(set)
            && normalizeNumber(card.metadata.number ?? card.localId) === normalizeNumber(number);
        })
      : query
      ? safeSetCards.filter((card) => {
          const localId = card.localId.toLowerCase();
          const id = card.id.toLowerCase();
          const name = normalizeCardNameForLookup(card.name);
          if (exactName) return name === query;
          return name.includes(query) || id.includes(query) || localId.includes(query);
        })
      : safeSetCards;

    const sortedCards = filteredCards.slice().sort(compareBySort(sort));
    const cards = sortedCards.slice(0, limit);

    return Response.json(
      {
        cards,
        totalInSet: safeSetCards.length,
        totalMatched: filteredCards.length,
        returned: cards.length,
        sort,
        code: 200,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to search deckbuilder cards:', error);
    return Response.json({ message: 'Failed to load cards', code: 500 }, { status: 500 });
  }
}
