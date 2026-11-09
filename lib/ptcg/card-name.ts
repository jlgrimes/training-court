const energyTypes: Record<string, string> = {
  g: 'Grass', r: 'Fire', w: 'Water', l: 'Lightning', p: 'Psychic',
  f: 'Fighting', d: 'Darkness', m: 'Metal', y: 'Fairy',
};

// Use the same spelling rules in catalog searches and replay comparisons.
// Preserve punctuation and suffixes so distinct cards still match exactly.
export const normalizeCardNameForLookup = (name: string): string =>
  name
    .replace(/\bBasic\s+\{([GRWLPFDMY])\}\s+Energy\b/gi,
      (_, type: string) => `Basic ${energyTypes[type.toLowerCase()]} Energy`)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019]/g, "'")
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/^(?:basic )?(grass|fire|water|lightning|psychic|fighting|darkness|metal|fairy) energy$/, 'basic $1 energy');
