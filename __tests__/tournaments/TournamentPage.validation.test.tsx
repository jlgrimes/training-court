import TournamentPage, { generateMetadata } from '../../app/tournaments/[id]/page';
import PtcgTournamentPage, { generateMetadata as ptcgMetadata } from '../../app/ptcg/tournaments/[id]/page';
import PocketTournamentPage, { generateMetadata as pocketMetadata } from '../../app/pocket/tournaments/[id]/page';
import { fetchTournament, fetchRounds } from '../../components/tournaments/utils/tournaments.server.utils';
import { fetchPocketTournament, fetchPocketRounds } from '../../components/pocket/tournaments/utils/pocket-tournaments.server.utils';

jest.mock('next/navigation', () => ({
  notFound: () => { throw new Error('NEXT_NOT_FOUND'); },
}));
jest.mock('../../components/tournaments/TournamentContainer/TournamentPageClient', () => ({
  TournamentPageClient: () => null,
}));
jest.mock('../../components/tournaments/utils/tournaments.server.utils', () => ({
  fetchTournament: jest.fn(),
  fetchRounds: jest.fn(),
}));
jest.mock('../../components/pocket/tournaments/utils/pocket-tournaments.server.utils', () => ({
  fetchPocketTournament: jest.fn(),
  fetchPocketRounds: jest.fn(),
}));

const tournamentId = '74f0efbb-35ca-482c-a2ad-6cfe402dbec9';
const tournament = { id: tournamentId, name: 'Test tournament' };
const allFetchers = [fetchTournament, fetchRounds, fetchPocketTournament, fetchPocketRounds];

beforeEach(() => {
  jest.clearAllMocks();
  (fetchTournament as jest.Mock).mockResolvedValue(tournament);
  (fetchPocketTournament as jest.Mock).mockResolvedValue(tournament);
  (fetchRounds as jest.Mock).mockResolvedValue([]);
  (fetchPocketRounds as jest.Mock).mockResolvedValue([]);
});

describe.each([
  { route: '/tournaments', page: TournamentPage, metadata: generateMetadata, fetch: fetchTournament, rounds: fetchRounds },
  { route: '/ptcg/tournaments', page: PtcgTournamentPage, metadata: ptcgMetadata, fetch: fetchTournament, rounds: fetchRounds },
  { route: '/pocket/tournaments', page: PocketTournamentPage, metadata: pocketMetadata, fetch: fetchPocketTournament, rounds: fetchPocketRounds },
])('$route/[id]', ({ page, metadata, fetch, rounds }) => {
  it.each(['nate.png', 'not-a-uuid', ''])('rejects %s before any database lookup', async (id) => {
    await expect(metadata({ params: { id } })).rejects.toThrow('NEXT_NOT_FOUND');
    await expect(page({ params: { id } })).rejects.toThrow('NEXT_NOT_FOUND');
    allFetchers.forEach(fetcher => expect(fetcher).not.toHaveBeenCalled());
  });

  it('loads metadata and page data for valid tournament IDs', async () => {
    const props = { params: { id: tournamentId } };
    await expect(metadata(props)).resolves.toEqual({ title: 'Test tournament' });
    const result = await page(props);
    expect(fetch).toHaveBeenCalledWith(tournamentId);
    expect(rounds).toHaveBeenCalledWith(tournamentId);
    expect(result.props.tournamentId).toBe(tournamentId);
    expect(result.props.initialTournament).toEqual(tournament);
  });
});
