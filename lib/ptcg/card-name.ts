// Use the same spelling rules in catalog searches and replay comparisons.
// Preserve punctuation and suffixes so distinct cards still match exactly.
export const normalizeCardNameForLookup = (name: string): string =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019]/g, "'")
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
