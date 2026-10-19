'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { TranslatedText } from '@/components/general-translation/TranslatedText';
import { Button } from '@/components/ui/button';
import { AddArchetype } from '@/components/archetype/AddArchetype/AddArchetype';
import { AddLimitlessArchetype } from '@/components/archetype/AddArchetype/AddLimitlessArchetype';
import { Sprite } from '@/components/archetype/sprites/Sprite';
import type { DeckRule, DeckRuleInput } from '@/components/archetype/utils/deck-rules';
import { HISTORICAL_SWR_OPTIONS } from '@/lib/swr-options';

const empty: DeckRuleInput = { card: '', second_card: null, archetype: '' };
const endpoint = '/api/admin/deck-rules';

export function DeckRulesEditor() {
  const { data, error, mutate } = useSWR<DeckRule[]>(endpoint, async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error();
    return (await response.json()).data;
  }, {
    ...HISTORICAL_SWR_OPTIONS,
    revalidateIfStale: false,
    refreshInterval: 0,
    shouldRetryOnError: false,
  });
  const [draft, setDraft] = useState<DeckRuleInput>(empty);
  const [id, setId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  function reset() { setDraft(empty); setId(null); }

  async function save(method: 'POST' | 'PATCH' | 'DELETE', ruleId = id) {
    setBusy(true); setFailed(false);
    try {
      const response = await fetch(endpoint, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, id: ruleId }),
      });
      if (!response.ok) throw new Error();
      reset(); await mutate();
    } catch { setFailed(true); }
    finally { setBusy(false); }
  }

  return <div className="space-y-4">
    <p><TranslatedText id="admin.deckRules.help">Choose the card to match and one or two sprites for its deck label. Optionally require a second card to identify a variant.</TranslatedText></p>
    {(error || failed) && <p role="alert"><TranslatedText id="admin.deckRules.error">Could not load or save rules. Check the fields and try again.</TranslatedText></p>}
    {error && <Button variant="outline" onClick={() => void mutate().catch(() => {})}><TranslatedText id="admin.deckRules.retry">Retry</TranslatedText></Button>}
    {!data && !error && <p><TranslatedText id="admin.deckRules.loading">Loading rules…</TranslatedText></p>}
    <div className="grid gap-3 max-w-xl">
      <fieldset className="space-y-1" disabled={busy}>
        <legend><TranslatedText id="admin.deckRules.card">Card</TranslatedText></legend>
        <AddLimitlessArchetype key={'card-' + id + '-' + draft.card} archetype={draft.card} setArchetype={card => setDraft({ ...draft, card })} isDisabled={busy} />
      </fieldset>
      <fieldset className="space-y-1" disabled={busy}>
        <legend><TranslatedText id="admin.deckRules.secondCard">Second card (optional)</TranslatedText></legend>
        <AddLimitlessArchetype key={'second-' + id + '-' + draft.second_card} archetype={draft.second_card ?? ''} setArchetype={card => setDraft({ ...draft, second_card: card || null })} isDisabled={busy} />
      </fieldset>
      <fieldset className="space-y-1" disabled={busy}>
        <legend><TranslatedText id="admin.deckRules.result">Deck label</TranslatedText></legend>
        <AddArchetype archetype={draft.archetype} setArchetype={archetype => setDraft({ ...draft, archetype })} isDisabled={busy} />
      </fieldset>
      <div className="flex gap-2">
        <Button disabled={busy || !data || !draft.card || !draft.archetype || draft.card === draft.second_card} onClick={() => void save(id ? 'PATCH' : 'POST')}><TranslatedText id="admin.deckRules.save">Save rule</TranslatedText></Button>
        <Button disabled={busy} variant="outline" onClick={reset}><TranslatedText id="admin.deckRules.new">New rule</TranslatedText></Button>
      </div>
    </div>
    <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr>
      <th><TranslatedText id="admin.deckRules.card">Card</TranslatedText></th>
      <th><TranslatedText id="admin.deckRules.secondCard">Second card (optional)</TranslatedText></th>
      <th><TranslatedText id="admin.deckRules.result">Deck label</TranslatedText></th><th />
    </tr></thead><tbody>{data?.map(rule => <tr key={rule.id} className="border-b">
      <td><Sprite name={rule.card} /></td><td>{rule.second_card && <Sprite name={rule.second_card} />}</td><td><Sprite name={rule.archetype} /></td>
      <td className="flex gap-2 py-2"><Button disabled={busy} variant="outline" onClick={() => { setId(rule.id); setDraft(rule); }}><TranslatedText id="admin.deckRules.edit">Edit</TranslatedText></Button>
        <Button disabled={busy} variant="outline" onClick={() => void save('DELETE', rule.id)}><TranslatedText id="admin.deckRules.delete">Delete</TranslatedText></Button></td>
    </tr>)}</tbody></table></div>
  </div>;
}
