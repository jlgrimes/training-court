import { determineArchetype } from '@/components/archetype/utils/archetype.utils';
import { DeckRule, matchesCard, validateDeckRule } from '@/components/archetype/utils/deck-rules';
import { parseBattleLog } from '@/components/battle-logs/utils/battle-log.utils';
import { parseBattleLogWithRules } from '@/components/archetype/utils/deck-rules.client';
import { battleLogConcessionReported } from '@/components/battle-logs/utils/testing-files/battleLogConcessionReported';
import { battleLogGerman } from '@/components/battle-logs/utils/testing-files/battleLogGerman';
import { battleLogSpanish } from '@/components/battle-logs/utils/testing-files/battleLogSpanish';

const order = jest.fn();
jest.mock('../../utils/supabase/client', () => ({
  createClient: () => ({ from: () => ({ select: () => ({ order }) }) }),
}));
const added: DeckRule = { id: 500, card: 'caterpie', second_card: null, archetype: 'butterfree' };
const variant: DeckRule = { id: 501, card: 'dreepy', second_card: 'torchic', archetype: 'dragapult,blaziken' };

it('adds an association without replacing built-in associations or direct detection', () => {
  expect(determineArchetype(['Alice played Caterpie.'], 'Alice', 'en')).toBeUndefined();
  expect(determineArchetype(['Alice played Caterpie.'], 'Alice', 'en', [added])).toBe('butterfree');
  expect(determineArchetype(['Alice played Dreepy.'], 'Alice', 'en', [added])).toBe('dragapult');
  expect(determineArchetype(['Alice played Miraidon.'], 'Alice', 'en', [added])).toBe('miraidon');
  expect(determineArchetype(['Alice played Dreepy.'], 'Alice', 'en', [])).toBe('dragapult');
});

it('extends the existing association order and allows explicit variants', () => {
  const log = ['Alice played Dreepy.', 'Alice played Caterpie.'];
  expect(determineArchetype(log, 'Alice', 'en', [added])).toBe('dragapult');
  expect(determineArchetype(log, 'Alice', 'en', [variant])).toBe('dragapult');
  expect(determineArchetype([...log, 'Alice played Torchic.'], 'Alice', 'en', [variant])).toBe('dragapult,blaziken');
});

it('uses the original log-line filter for additional associations', () => {
  expect(determineArchetype(['Bob played Caterpie.', 'Alice drew Caterpie.', '• Caterpie'], 'Alice', 'en', [added])).toBeUndefined();
});

it.each([
  ['de', 'Alice hat Grolldra auf die Bank gelegt.', 'Alice hat Flemmli auf die Bank gelegt.'],
  ['fr', 'Alice a joué Fantyrm sur le Banc.', 'Alice a joué Poussifeu sur le Banc.'],
  ['es', 'Alice puso en juego a Dreepy en la Banca.', 'Alice puso en juego a Torchic en la Banca.'],
  ['it', 'Alice ha pescato e giocato Dreepy in panchina.', 'Alice ha pescato e giocato Torchic in panchina.'],
  ['pt-br', 'Alice jogou Dreepy no Banco.', 'Alice jogou Torchic no Banco.'],
] as const)('resolves sprite names in %s without a different parser', (language, first, second) => {
  expect(determineArchetype([first, second], 'Alice', language, [variant])).toBe('dragapult,blaziken');
  expect(determineArchetype([first, second.replace('Alice', 'Bob')], 'Alice', language, [variant])).toBe('dragapult');
});

it('normalizes sprite names and localized Unicode without partial matches', () => {
  expect(matchesCard(['CRUSHING-HAMMER'], 'crushing-hammer', 'en')).toBe(true);
  expect(matchesCard(['Salame\u0300che'], 'charmander', 'fr')).toBe(true);
  expect(matchesCard(['Caterpieish'], 'caterpie', 'en')).toBe(false);
});

it.each([battleLogConcessionReported, battleLogGerman, battleLogSpanish])('leaves the parsed result unchanged when the extra association does not match', log => {
  const before = parseBattleLog(log, 'id', '', null, null, null, null, null);
  const after = parseBattleLog(log, 'id', '', null, null, null, null, null, [added]);
  expect(after).toEqual(before);
});

it('keeps the original parser working when the association request fails', async () => {
  const before = parseBattleLog(battleLogConcessionReported, 'id', '', null, null, null);
  order.mockResolvedValueOnce({ data: null, error: { message: 'Unavailable' } });
  expect(await parseBattleLogWithRules(battleLogConcessionReported, 'id', '', null, null, null)).toEqual(before);
  order.mockRejectedValueOnce(new Error('Offline'));
  expect(await parseBattleLogWithRules(battleLogConcessionReported, 'id', '', null, null, null)).toEqual(before);
});

it('passes database additions into the original parser without changing turns or results', async () => {
  const before = parseBattleLog(battleLogGerman, 'id', '', null, null, 'player1');
  order.mockResolvedValueOnce({ data: [{ id: 502, card: 'terapagos', second_card: null, archetype: 'terapagos,pikachu' }], error: null });
  const after = await parseBattleLogWithRules(battleLogGerman, 'id', '', null, null, 'player1');
  expect(after.players[0].deck).toBe('terapagos,pikachu');
  expect(after.sections).toEqual(before.sections);
  expect(after.winner).toBe(before.winner);
  expect(after.players.map(player => player.result)).toEqual(before.players.map(player => player.result));
});

it('validates one or two deck sprite names', () => {
  expect(validateDeckRule(added)).toEqual({ card: added.card, second_card: null, archetype: added.archetype });
  for (const bad of [{ card: '' }, { card: 'Dreepy!' }, { second_card: ['torchic'] }, { second_card: 'caterpie' }, { archetype: 'a,b,c' }]) {
    expect(validateDeckRule({ ...added, ...bad })).toBeNull();
  }
});
