import {
  getAllDeckbuilderCards,
  getDeckbuilderCardsBySet,
  type DeckbuilderCatalogCard,
} from '@/lib/server/ptcg-card-catalog';

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
    const query = searchParams.get('query')?.trim().toLowerCase() ?? '';
    const rawLimit = Number(searchParams.get('limit'));
    const limit = Number.isFinite(rawLimit)
      ? Math.max(1, Math.min(MAX_LIMIT, Math.floor(rawLimit)))
      : DEFAULT_LIMIT;
    const sortParam = searchParams.get('sort')?.trim().toLowerCase() as CardSort | null;
    const sort: CardSort = sortParam === 'name-asc' || sortParam === 'name-desc' || sortParam === 'recent' ? sortParam : 'recent';

    const isAllSets = !setId || setId === 'all';
    const setCards = isAllSets
      ? await getAllDeckbuilderCards()
      : await getDeckbuilderCardsBySet(setId);
    const safeSetCards = Array.isArray(setCards) ? setCards : [];
    const filteredCards = query
      ? safeSetCards.filter((card) => {
          const localId = card.localId.toLowerCase();
          const id = card.id.toLowerCase();
          const name = card.name.toLowerCase();
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
