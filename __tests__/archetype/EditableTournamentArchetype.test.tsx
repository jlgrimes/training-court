import { render, screen } from '@testing-library/react';
import { EditableTournamentArchetype } from '@/components/archetype/AddArchetype/AddTournamentArchetype';

jest.mock('typescript-cookie', () => ({
  getCookie: jest.fn(),
  setCookie: jest.fn(),
  removeCookie: jest.fn(),
}), { virtual: true });

jest.mock('date-fns', () => ({
  isAfter: jest.fn(() => false),
}));

jest.mock('@/components/archetype/sprites/Sprite', () => ({
  Sprite: ({ name }: { name: string }) => <div>sprite:{name}</div>,
}), { virtual: true });

describe('EditableTournamentArchetype', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a visible empty state for deck input', () => {
    render(
      <EditableTournamentArchetype
        tournament={{
          id: 'test-tournament-id',
          name: 'League Cup',
          deck: null,
          date_to: '2099-01-01',
        } as any}
      />
    );

    expect(screen.getByText('Your deck:')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add deck' })).toBeTruthy();
  });
});
