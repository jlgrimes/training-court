import { render, screen } from '@testing-library/react';
import TournamentRoundList, { computeRoundListLayout } from '../../components/tournaments/TournamentRoundList';
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

beforeAll(() => {
  (global as any).ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
});

describe('computeRoundListLayout', () => {
  it('does not scale when content already fits', () => {
    expect(computeRoundListLayout(600, 500)).toEqual({
      scale: 1,
      height: undefined,
    });
  });

  it('scales to fit when content is taller than viewport budget', () => {
    expect(computeRoundListLayout(500, 1000)).toEqual({
      scale: 0.5,
      height: 500,
    });
  });

  it('caps scale at 0.9 maximum', () => {
    expect(computeRoundListLayout(900, 950)).toEqual({
      scale: 0.9,
      height: 900,
    });
  });
});

describe('TournamentRoundList', () => {
  it('renders all rows and does not use scroll-wrapper classes', () => {
    const { container } = render(
      <TournamentRoundList
        tournament={createTournament()}
        userId="user-1"
        rounds={createRounds(25)}
        updateClientRoundsOnEdit={jest.fn()}
      />
    );

    expect(screen.getAllByTestId('round-row')).toHaveLength(25);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('origin-top-left');
    expect(root.className).not.toContain('overflow-y-auto');
  });
});
