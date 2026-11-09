import { normalizeCardNameForLookup } from '@/lib/ptcg/card-name';

export const replayCardIdentifier = (name: string) => name.trim().match(/^\(([^)]+)\)\s+/)?.[1].toLowerCase();

export const replayCardKey = (card: { name: string; identifier?: string }) =>
  card.identifier ? `id:${card.identifier}` : `name:${normalizeCardNameForLookup(card.name)}`;

export const matchesReplayCard = (card: { name: string; identifier?: string }, rawName: string) => {
  const identifier = replayCardIdentifier(rawName);
  const name = rawName.trim().replace(/^\([^)]+\)\s+/, '');
  return identifier ? card.identifier === identifier : normalizeCardNameForLookup(card.name) === normalizeCardNameForLookup(name);
};
