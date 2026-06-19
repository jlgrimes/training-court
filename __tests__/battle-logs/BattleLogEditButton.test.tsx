import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockUpdate = jest.fn();

jest.mock('../../utils/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      update: mockUpdate,
    }),
  }),
}));

jest.mock('../../components/ui/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock('recoil', () => ({
  atom: jest.fn((config) => config),
  useSetRecoilState: () => jest.fn(),
}));

jest.mock('../../components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTrigger: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>{children}</button>
  ),
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogClose: ({ children, onClick }: { children: React.ReactElement; onClick?: () => void }) =>
    React.cloneElement(children, { onClick }),
}));

jest.mock('../../components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
}));

jest.mock('../../components/archetype/AddArchetype/AddArchetype', () => ({
  AddArchetype: ({ archetype, setArchetype }: { archetype: string; setArchetype: (value: string) => void }) => (
    <input aria-label="Archetype" value={archetype} onChange={(event) => setArchetype(event.target.value)} />
  ),
}));

jest.mock('../../components/ptcg/deckbuilder/DecklistSelect', () => ({
  DecklistSelect: ({ onChange }: { onChange: (decklist: { id: string; name: string; archetype: string } | null) => void }) => (
    <button
      type="button"
      onClick={() => onChange({ id: 'decklist-1', name: 'Saved Charizard List', archetype: 'charizard' })}
    >
      Select saved decklist
    </button>
  ),
}));

const { BattleLogEditButton } = require('../../components/battle-logs/BattleLogDisplay/BattleLogEdit/BattleLogEditButton') as typeof import('../../components/battle-logs/BattleLogDisplay/BattleLogEdit/BattleLogEditButton');

describe('BattleLogEditButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdate.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });
  });

  it('associates a decklist without overwriting the parsed deck archetype', async () => {
    render(
      <BattleLogEditButton
        isEditing
        shouldDisable={false}
        userId="user-1"
        currentPlayer={{
          name: 'Player',
          deck: 'dragapult,pidgeot',
          oppDeck: 'gardevoir',
          result: 'W',
        }}
        log={{
          id: 'log-1',
          decklist_id: null,
          format: 'Standard',
          language: 'en',
          players: [],
          date: '2026-01-01T00:00:00.000Z',
          winner: 'Player',
          sections: [],
        }}
      />
    );

    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.click(await screen.findByRole('button', { name: 'Select saved decklist' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply changes' }));

    await waitFor(() => expect(mockUpdate).toHaveBeenCalled());
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        archetype: 'dragapult,pidgeot',
        decklist_id: 'decklist-1',
      })
    );
  });
});
