import type { Language } from '@/lib/i18n/battle-log';

import { getCardNames } from '@/lib/i18n/card-sprite-names';

export interface DeckRule {
  id: number;
  card: string;
  second_card: string | null;
  archetype: string;
}
export type DeckRuleInput = Omit<DeckRule, 'id'>;

const normalize = (value: string) => value.normalize('NFKC').toLocaleLowerCase().replace(/[’‘]/g, "'").replace(/[-\s]+/g, ' ').trim();
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function matchesCard(lines: string[], sprite: string, language: Language): boolean {
  return getCardNames(sprite, language).some(name => {
    const escaped = escapeRegex(normalize(name));
    const pattern = new RegExp(String.raw`(^|[^\p{L}\p{N}])${escaped}(?=$|[^\p{L}\p{N}])`, 'u');
    return !!escaped && lines.some(line => pattern.test(normalize(line)));
  });
}

export function validateDeckRule(value: unknown): DeckRuleInput | null {
  if (!value || typeof value !== 'object') return null;
  const rule = value as DeckRuleInput;
  const sprite = (name: unknown): name is string => typeof name === 'string' && name.length <= 100 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name);
  if (!sprite(rule.card) || (rule.second_card !== null && !sprite(rule.second_card))
    || rule.card === rule.second_card || typeof rule.archetype !== 'string') return null;
  const deck = rule.archetype.split(',');
  if (deck.length < 1 || deck.length > 2 || !deck.every(sprite) || new Set(deck).size !== deck.length) return null;
  return { card: rule.card, second_card: rule.second_card, archetype: rule.archetype };
}
