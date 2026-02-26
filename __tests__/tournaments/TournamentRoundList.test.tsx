import { render, screen } from '@testing-library/react';
import TournamentRoundList from '../../components/tournaments/TournamentRoundList';
import { Database } from '../../database.types';

jest.mock('../../components/tournaments/TournamentRound', () => ({
  TournamentRound: ({ round }: { round: Database['public']['Tables']['tournament rounds']['Row'] }) => (
    <div data-testid="round-row">{round.round_num}</div>
  ),
}));

type Tournament = Database['public']['Tables']['tournaments']['Row'];
type Round = Database['public']['Tables']['tournament rounds']['Row'];

function createTournament(): Tournament {
  return {
    id: 't-1',
    category: null,
    created_at: '2026-01-01T00:00:00.000Z',
    date_from: '2026-01-01',
    date_to: '2026-01-01',
    deck: null,
    format: null,
    hat_type: null,
    name: 'Test Tournament',
    notes: null,
    placement: null,
    user: 'user-1',
  };
}

function createRounds(count: number): Round[] {
  return Array.from({ length: count }, (_, idx) => ({
    id: `round-${idx + 1}`,
    created_at: '2026-01-01T00:00:00.000Z',
    deck: null,
    match_end_reason: null,
    result: ['W'],
    round_num: idx + 1,
    tournament: 't-1',
    turn_orders: null,
    user: 'user-1',
  }));
}

describe('TournamentRoundList', () => {
  it('renders all rows for a large round list without scale transforms', () => {
    const { container } = render(
      <TournamentRoundList
        tournament={createTournament()}
        userId="user-1"
        rounds={createRounds(25)}
        updateClientRoundsOnEdit={jest.fn()}
      />
    );

    expect(screen.getAllByTestId('round-row')).toHaveLength(25);
    expect(container.querySelector('[style*="scale("]')).toBeNull();
    expect(container.querySelector('[style*="transform"]')).toBeNull();
  });

  it('uses a scroll container with a sticky header', () => {
    const { container } = render(
      <TournamentRoundList
        tournament={createTournament()}
        userId="user-1"
        rounds={createRounds(25)}
        updateClientRoundsOnEdit={jest.fn()}
      />
    );

    const scrollContainer = container.firstElementChild as HTMLElement;
    const headerRow = screen.getByText('Round').closest('div');

    expect(scrollContainer.className).toContain('overflow-y-auto');
    expect(scrollContainer.className).toContain('max-h-[65vh]');
    expect(headerRow?.className).toContain('sticky');
  });
});
