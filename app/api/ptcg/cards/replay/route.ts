import { getAllDeckbuilderCards, type DeckbuilderCatalogCard } from '@/lib/server/ptcg-card-catalog';
import { supplementalReplayCards } from '@/lib/server/replay-card-images';
import { replayCatalogSetIds } from '@/lib/ptcg/replay-card-lookup';
import { normalizeCardNameForLookup } from '@/lib/ptcg/card-name';
import { replayCardKey } from '@/components/battle-logs/Replay/card-identity';

type Lookup = { name: string; identifier?: string };
const numberKey = (value: string) => value.toLowerCase().replace(/^0+(?=\d)/, '');
const identifierKey = (value: string) => {
  const match = value.toLowerCase().match(/^([^_]+)_([^_]+)(?:_(?:ph|mph))?$/);
  return match ? `${match[1]}_${numberKey(match[2])}` : value.toLowerCase();
};

export async function POST(request: Request) {
  let cards: Lookup[];
  try {
    const body = await request.json();
    if (!Array.isArray(body?.cards) || body.cards.length > 512 || body.cards.some((card: Lookup) =>
      !card || typeof card.name !== 'string' || !card.name.trim() || card.name.length > 200
      || (card.identifier !== undefined && (typeof card.identifier !== 'string' || card.identifier.length > 100)))) {
      return Response.json({ message: 'Expected up to 512 card lookups' }, { status: 400 });
    }
    cards = body.cards;
  } catch {
    return Response.json({ message: 'Invalid JSON body' }, { status: 400 });
  }
  if (!cards.length) return Response.json({ cardsByKey: {} });

  try {
    const byIdentifier = new Map<string, DeckbuilderCatalogCard[]>();
    const byName = new Map<string, DeckbuilderCatalogCard[]>();
    const index = (card: DeckbuilderCatalogCard) => {
      const identifiers = new Set([identifierKey(card.id), ...replayCatalogSetIds(card.metadata)
        .map((set) => `${set}_${numberKey(card.metadata.number ?? card.localId)}`)]);
      identifiers.forEach((key) => byIdentifier.set(key, [...(byIdentifier.get(key) ?? []), card]));
      const name = normalizeCardNameForLookup(card.name);
      byName.set(name, [...(byName.get(name) ?? []), card]);
    };
    supplementalReplayCards.forEach(index);
    const hasLocal = (lookup: Lookup) => lookup.identifier && byIdentifier.get(identifierKey(lookup.identifier))
      ?.some((card) => normalizeCardNameForLookup(card.name) === normalizeCardNameForLookup(lookup.name));
    if (cards.some((card) => !hasLocal(card))) {
      (await getAllDeckbuilderCards()).forEach(index);
    }
    const cardsByKey = Object.fromEntries(cards.map((lookup) => {
      const name = normalizeCardNameForLookup(lookup.name);
      const candidates = lookup.identifier ? byIdentifier.get(identifierKey(lookup.identifier)) : byName.get(name);
      const matches = (candidates ?? []).filter((card) => normalizeCardNameForLookup(card.name) === name);
      // Preserve the existing newest-set preference only for name-only logs.
      if (!lookup.identifier) matches.sort((a, b) =>
        (b.metadata.setReleaseDate ?? '').localeCompare(a.metadata.setReleaseDate ?? '')
        || a.localId.localeCompare(b.localId, undefined, { numeric: true }));
      const card = matches[0];
      return [replayCardKey(lookup), card ? {
        id: card.id, name: card.name, imageUrl: card.imageUrl, imageUrlHiRes: card.imageUrlHiRes,
      } : null];
    }));
    return Response.json({ cardsByKey });
  } catch (error) {
    console.error('Failed to resolve replay cards:', error);
    return Response.json({ message: 'Failed to load replay cards' }, { status: 503 });
  }
}
