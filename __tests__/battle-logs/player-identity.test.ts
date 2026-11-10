import { parseBattleLog, parseStoredBattleLog } from '@/components/battle-logs/utils/battle-log.utils';
import { getBattleLogMetadataFromLog } from '@/components/battle-logs/BattleLogInput/BattleLogInput.utils';
import { samePtcglUsername } from '@/lib/ptcgl-username';
import { Database } from '@/database.types';

import { logText } from '@/components/battle-logs/utils/testing-files/identityFixture';

const parsed = () => parseBattleLog(logText, 'id', '2026-11-09', null, null, null);
const row = (extra = {}) => ({
  id: 'id', log: logText, created_at: '2026-11-09', user: 'user', format: 'Standard',
  archetype: null, opp_archetype: null, result: 'W', turn_order: '2', notes: null,
  decklist_id: null, ...extra,
} as Database['public']['Tables']['logs']['Row']);

describe('PTCGL player identity', () => {
  it('matches capitalization and surrounding whitespace but preserves internal spaces', () => {
    expect(samePtcglUsername('Gregamilenko', '  GREGAMILENKO \t')).toBe(true);
    expect(samePtcglUsername('A B', 'AB')).toBe(false);
    expect(samePtcglUsername('', ' ')).toBe(false);
  });

  it('records the supplied winner as a win going second despite trailing whitespace', () => {
    expect(getBattleLogMetadataFromLog(parsed(), 'gregamilenko ')).toMatchObject({ result: 'W', turn_order: '2' });
  });

  it('recalculates both result and turn order for either player', () => {
    expect(getBattleLogMetadataFromLog(parsed(), 'yaaafii')).toMatchObject({ result: 'L', turn_order: '1' });
    expect(getBattleLogMetadataFromLog(parsed(), 'Gregamilenko')).toMatchObject({ result: 'W', turn_order: '2' });
  });

  it.each([null, undefined, '', '  ', 'SomeoneElse'])('does not silently record a loss for unmatched name %s', (name) => {
    expect(getBattleLogMetadataFromLog(parsed(), name)).toEqual({ archetype: null, opp_archetype: null, result: null, turn_order: null });
  });

  it('orders the current player using a normalized name', () => {
    expect(parseBattleLog(logText, '', '', null, null, ' YAAAFII ').players[0].name).toBe('yaaafii');
  });

  it('uses the verified result even when Preferences matches the opponent', () => {
    expect(parseStoredBattleLog(row(), 'yaaafii').players[0].name).toBe('Gregamilenko');
  });

  it('falls back to Preferences when the stored result is missing', () => {
    expect(parseStoredBattleLog(row({ result: null }), 'yaaafii').players[0].name).toBe('yaaafii');
  });

  it.each([['W', 'Gregamilenko'], ['L', 'yaaafii']])('uses the verified %s result without rewriting the row', (result, name) => {
    const stored = row({ result });
    expect(parseStoredBattleLog(stored, 'NewUsername').players[0].name).toBe(name);
    expect(stored.result).toBe(result);
  });
});
