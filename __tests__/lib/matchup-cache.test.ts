import type { MatchupAggregateRow } from '@/components/premium/matchups/Matchups.types';
import { getCachedMatchups } from '@/lib/server/matchup-cache';

const aggregate = (deck: string): MatchupAggregateRow[] => [{
  source: 'logs',
  deck,
  decklist_id: null,
  opp_deck: 'Opponent',
  format: 'standard',
  wins: 1,
  losses: 0,
  ties: 0,
  going_first_wins: 1,
  going_first_losses: 0,
  going_first_ties: 0,
  going_second_wins: 0,
  going_second_losses: 0,
  going_second_ties: 0,
  last_played: '2026-09-07T00:00:00.000Z',
}];

describe('getCachedMatchups', () => {
  it('reuses a cached value only for the same user', async () => {
    const firstLoader = jest.fn().mockResolvedValue(aggregate('Deck A'));
    const secondLoader = jest.fn().mockResolvedValue(aggregate('Deck B'));

    const first = await getCachedMatchups('cache-test-user-a', firstLoader);
    const repeated = await getCachedMatchups('cache-test-user-a', firstLoader);
    const second = await getCachedMatchups('cache-test-user-b', secondLoader);

    expect(repeated).toBe(first);
    expect(second).toEqual(aggregate('Deck B'));
    expect(firstLoader).toHaveBeenCalledTimes(1);
    expect(secondLoader).toHaveBeenCalledTimes(1);
  });

  it('coalesces concurrent loads for one user', async () => {
    let resolveLoad!: (value: MatchupAggregateRow[]) => void;
    const loader = jest.fn(() => new Promise<MatchupAggregateRow[]>((resolve) => {
      resolveLoad = resolve;
    }));

    const first = getCachedMatchups('cache-test-concurrent-user', loader);
    const second = getCachedMatchups('cache-test-concurrent-user', loader);

    expect(loader).toHaveBeenCalledTimes(1);
    resolveLoad(aggregate('Deck C'));

    await expect(first).resolves.toEqual(aggregate('Deck C'));
    await expect(second).resolves.toEqual(aggregate('Deck C'));
  });
});
