import { createClient } from '@/utils/supabase/client';
import { parseBattleLog } from '@/components/battle-logs/utils/battle-log.utils';
import type { DeckRule } from './deck-rules';

// Fetch once per import action; keep the shared parser synchronous.
export async function parseBattleLogWithRules(...args: Parameters<typeof parseBattleLog>) {
  let rules: DeckRule[] = [];
  try {
    const { data, error } = await createClient().from('deck_identification_rules').select('*').order('id');
    if (!error) rules = data ?? [];
  } catch {
    // Additional associations are optional; the original identifier still works.
  }
  const [log, id, date, archetype, opponent, screenName, format, decklistId] = args;
  return parseBattleLog(log, id, date, archetype, opponent, screenName, format, decklistId, rules);
}
