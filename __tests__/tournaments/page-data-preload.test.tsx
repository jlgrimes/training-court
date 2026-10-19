import { renderHook } from '@testing-library/react';
import { usePageDataPreload } from '../../hooks/usePageDataPreload';
import { preload } from 'swr';
import { usePathname } from 'next/navigation';
import { fetchTournaments } from '../../hooks/tournaments/useTournaments.utils';
import { fetchPaginatedLogs } from '../../components/battle-logs/utils/battle-log.server.utils';

jest.mock('next/navigation', () => ({ usePathname: jest.fn() }));
jest.mock('swr', () => ({ preload: jest.fn(() => Promise.resolve([])) }));
jest.mock('../../hooks/tournaments/useTournaments.utils', () => ({ fetchTournaments: jest.fn() }));
jest.mock('../../hooks/pocket/tournaments/usePocketTournaments.utils', () => ({ fetchPocketTournaments: jest.fn() }));
jest.mock('../../components/battle-logs/utils/battle-log.server.utils', () => ({ fetchPaginatedLogs: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

it('starts the tournament summary read as soon as a user is available', () => {
  (usePathname as jest.Mock).mockReturnValue('/ptcg/tournaments');
  const { rerender } = renderHook(({ userId }: { userId?: string }) => usePageDataPreload(userId), {
    initialProps: { userId: undefined } as { userId?: string },
  });
  expect(preload).not.toHaveBeenCalled();
  rerender({ userId: 'user' });
  expect(preload).toHaveBeenCalledTimes(1);
  const [key, fetcher] = (preload as jest.Mock).mock.calls[0];
  expect(key).toEqual(['tournaments', 'user', 26]);
  fetcher();
  expect(fetchTournaments).toHaveBeenCalledWith('user', 26);
});

it('uses the same cache key as the battle log list', () => {
  (usePathname as jest.Mock).mockReturnValue('/ptcg/logs');
  renderHook(() => usePageDataPreload('user'));
  const [key, fetcher] = (preload as jest.Mock).mock.calls[0];
  expect(key).toEqual(['paginated-logs', 'user', 0, 50]);
  fetcher();
  expect(fetchPaginatedLogs).toHaveBeenCalledWith('user', 0, 50);
});

it('does not fetch full rounds or preload lists on detail pages', () => {
  (usePathname as jest.Mock).mockReturnValue('/ptcg/tournaments/example');
  renderHook(() => usePageDataPreload('user'));
  expect(preload).not.toHaveBeenCalled();
});
