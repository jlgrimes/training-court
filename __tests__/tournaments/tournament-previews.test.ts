import { fetchTournaments } from '../../hooks/tournaments/useTournaments.utils';
import { fetchPocketTournaments } from '../../hooks/pocket/tournaments/usePocketTournaments.utils';
import { formatTournamentRecord } from '../../components/tournaments/utils/tournament-record';

const rpc = jest.fn();
jest.mock('../../utils/supabase/client', () => ({ createClient: () => ({ rpc }) }));

beforeEach(() => rpc.mockReset());

it.each([
  ['ptcg', fetchTournaments], ['pocket', fetchPocketTournaments],
] as const)('loads %s previews and records in a single RPC', async (game, fetcher) => {
  const rows = [{ id: 'tournament', wins: 2, losses: 1, ties: 0 }];
  rpc.mockResolvedValue({ data: rows, error: null });
  expect(await fetcher('user', 5)).toEqual(rows);
  expect(rpc).toHaveBeenCalledTimes(1);
  expect(rpc).toHaveBeenCalledWith('get_tournament_previews_v1', { game, preview_limit: 5 });
});

it('does not query without a user and propagates database failures', async () => {
  expect(await fetchTournaments(undefined)).toBeNull();
  expect(rpc).not.toHaveBeenCalled();
  rpc.mockResolvedValue({ data: null, error: new Error('Database unavailable') });
  await expect(fetchTournaments('user')).rejects.toThrow('Database unavailable');
});

it('formats records consistently with existing previews', () => {
  expect(formatTournamentRecord({ wins: 0, losses: 0, ties: 0 })).toBe('0-0');
  expect(formatTournamentRecord({ wins: 3, losses: 1, ties: 0 })).toBe('3-1');
  expect(formatTournamentRecord({ wins: 3, losses: 1, ties: 2 })).toBe('3-1-2');
});
