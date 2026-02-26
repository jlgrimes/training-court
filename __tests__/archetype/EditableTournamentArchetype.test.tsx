import { render, screen } from '@testing-library/react';
import { EditableTournamentArchetype } from '@/components/archetype/AddArchetype/AddTournamentArchetype';
import { getCookie } from 'typescript-cookie';

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
    (getCookie as jest.Mock).mockReturnValue(undefined);
  });

  it('renders add-deck button in empty state without extra label text', () => {
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

    expect(screen.getByRole('button', { name: 'Add deck' })).toBeTruthy();
    expect(screen.queryByText('Your deck:')).toBeNull();
  });

  it('keeps deck editable when local deck cookie exists for active tournaments', () => {
    (getCookie as jest.Mock).mockReturnValue('Gardevoir ex');

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

    expect(screen.getByRole('button', { name: 'Edit deck' })).toBeTruthy();
    expect(document.querySelector('img[alt*="gardevoir-ex"]')).toBeTruthy();
  });
});
