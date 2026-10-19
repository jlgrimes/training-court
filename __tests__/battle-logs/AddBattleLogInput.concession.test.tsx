import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { AddBattleLogInput } from '@/components/battle-logs/BattleLogInput/AddBattleLogInput';
import { battleLogNewStructure } from '@/components/battle-logs/utils/testing-files/battleLogNewStructure';
import { battleLogBrazilianPortuguese } from '@/components/battle-logs/utils/testing-files/battleLogBrazilianPortuguese';
import { battleLogItalian } from '@/components/battle-logs/utils/testing-files/battleLogItalian';
import { battleLogConcessionReported } from '@/components/battle-logs/utils/testing-files/battleLogConcessionReported';
import type { Database } from '@/database.types';

const mockInsert = jest.fn();
const mockFrom = jest.fn();
const mockToast = jest.fn();

jest.mock('../../utils/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}));

jest.mock('../../components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

jest.mock('@vercel/analytics', () => ({ track: jest.fn() }));
jest.mock('js-cookie', () => ({ get: jest.fn(), set: jest.fn() }));
jest.mock('gt-react', () => ({
  T: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useGT: () => (text: string) => text,
}));

jest.mock('../../components/archetype/AddArchetype/AddArchetype', () => ({
  AddArchetype: () => null,
}));

jest.mock('../../components/ptcg/deckbuilder/DecklistSelect', () => ({
  DecklistSelect: () => null,
}));

// Existing full PTCGL fixtures ending in concessions. Keep parsing and metadata
// extraction real so these tests cover both the review and database payload.
const concessionLogs = [
  {
    language: 'reported English log with indentation',
    log: battleLogConcessionReported,
    winner: 'Alienaura1',
    loser: 'Vertuistik',
  },
  {
    language: 'English (winner listed first)',
    log: battleLogNewStructure,
    winner: 'Bassoonboy135',
    loser: 'Player2',
  },
  {
    language: 'Brazilian Portuguese (winner listed second)',
    log: battleLogBrazilianPortuguese,
    winner: 'BrPtPlayer2',
    loser: 'BrPtPlayer1',
  },
  {
    language: 'Italian (winner listed second)',
    log: battleLogItalian,
    winner: 'italianPlayer1',
    loser: 'italianPlayer2',
  },
];

describe.each(concessionLogs)('concession imports: $language', ({ log, winner, loser }) => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    mockFrom.mockReturnValue({ insert: mockInsert });
    mockInsert.mockImplementation((payload) => ({
      select: () => ({
        returns: () => Promise.resolve({
          data: [{ id: 'saved-log', created_at: '2026-01-01T00:00:00.000Z', ...payload }],
          error: null,
        }),
      }),
    }));
  });

  it.each([
    { scenario: 'opponent concedes', screenName: winner, result: 'W' },
    { scenario: 'current player concedes', screenName: loser, result: 'L' },
  ])('reviews and saves $result when $scenario', async ({ screenName, result }) => {
    const onLogAdded = jest.fn();
    const userData = {
      id: 'user-1',
      // Profile capitalization need not match the exported log.
      live_screen_name: screenName.toLowerCase(),
    } as Database['public']['Tables']['user data']['Row'];

    render(<AddBattleLogInput userData={userData} onLogAdded={onLogAdded} />);

    fireEvent.paste(screen.getByPlaceholderText('Paste PTCGL log here'), {
      clipboardData: { getData: () => log },
    });

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(`Result: ${result}`)).toBeVisible();
    expect(mockInsert).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(onLogAdded).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'saved-log', result, log })
    ));
    expect(mockFrom).toHaveBeenCalledWith('logs');
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      user: 'user-1',
      result,
      log,
    }));
    expect(mockToast).not.toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
  });
});
