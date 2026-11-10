import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AddBattleLogInput } from '@/components/battle-logs/BattleLogInput/AddBattleLogInput';
import { Database } from '@/database.types';
import { logText } from '@/components/battle-logs/utils/testing-files/identityFixture';

const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockFrom = jest.fn((table: string) => table === 'logs'
  ? { insert: (payload: unknown) => ({ select: () => ({ single: () => mockInsert(payload) }) }) }
  : { update: (payload: unknown) => ({ eq: (key: string, id: string) => ({ select: () => ({ single: () => mockUpdate(payload, key, id) }) }) }) });
const mockToast = jest.fn();
const mockSetUserData = jest.fn();
jest.mock('../../utils/supabase/client', () => ({ createClient: () => ({ from: mockFrom }) }));
jest.mock('recoil', () => ({ useSetRecoilState: () => mockSetUserData, atom: (v: unknown) => v }));
jest.mock('../../components/ui/use-toast', () => ({ useToast: () => ({ toast: mockToast }) }));
jest.mock('@vercel/analytics', () => ({ track: jest.fn() }));
jest.mock('gt-react', () => ({ T: ({ children }: { children: React.ReactNode }) => children, useGT: () => (text: string) => text }));
jest.mock('../../components/archetype/AddArchetype/AddArchetype', () => ({ AddArchetype: () => null }));
jest.mock('../../components/ptcg/deckbuilder/DecklistSelect', () => ({ DecklistSelect: () => null }));
jest.mock('../../components/ui/select', () => {
  const React = require('react');
  const Context = React.createContext({ value: '', onValueChange: () => {}, disabled: false });
  return {
    Select: ({ children, ...props }: any) => <Context.Provider value={props}>{children}</Context.Provider>,
    SelectTrigger: ({ children, id }: any) => <div id={id}>{children}</div>,
    SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
    SelectContent: ({ children }: any) => <div>{children}</div>,
    SelectItem: ({ children, value }: any) => {
      const context = React.useContext(Context);
      return <button disabled={context.disabled} onClick={() => context.onValueChange(value)}>{children}</button>;
    },
  };
});

const userData = (name: string | null) => ({
  id: 'owner', avatar: null, created_at: '', live_screen_name: name, preferred_games: null,
} as Database['public']['Tables']['user data']['Row']);

function paste() {
  fireEvent.paste(screen.getByPlaceholderText('Paste PTCGL log here'), {
    clipboardData: { getData: () => logText },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockInsert.mockResolvedValue({ data: { id: 'saved', result: 'W' }, error: null });
  mockUpdate.mockResolvedValue({ data: { id: 'owner' }, error: null });
});

it.each([null, 'OtherUsername'])('requires selection for missing or unmatched username %s', async (name) => {
  const onLogAdded = jest.fn();
  render(<AddBattleLogInput userData={userData(name)} onLogAdded={onLogAdded} />);
  paste();
  expect(screen.getByText('Which player are you?')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Gregamilenko' }));
  expect(screen.getByText('Result: W')).toBeInTheDocument();
  expect(screen.queryByText(/Turn order:/)).not.toBeInTheDocument();
  expect(screen.getByText('Result: W')).toHaveClass('bg-emerald-100', 'text-black', 'dark:text-white', 'dark:bg-emerald-900');
  fireEvent.click(screen.getByRole('button', { name: 'yaaafii' }));
  expect(screen.getByText('Result: L')).toBeInTheDocument();
  expect(screen.getByText('Result: L')).toHaveClass('bg-red-100', 'text-black', 'dark:text-white', 'dark:bg-red-900');
  fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
  await waitFor(() => expect(onLogAdded).toHaveBeenCalled());
  expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ user: 'owner', result: 'L', turn_order: '1' }));
  expect(mockUpdate).toHaveBeenCalledWith({ live_screen_name: 'yaaafii' }, 'id', 'owner');
  expect(mockSetUserData).toHaveBeenCalled();
});

it('automatically matches a normalized username without offering player correction', async () => {
  render(<AddBattleLogInput userData={userData(' GREGAMILENKO ')} />);
  paste();
  expect(screen.queryByText('Which player are you?')).not.toBeInTheDocument();
  expect(screen.getByText('Result: W')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
  await waitFor(() => expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ result: 'W' })));
});

it('does not save the log or preferences when cancelled', () => {
  render(<AddBattleLogInput userData={userData(null)} />);
  paste();
  fireEvent.click(screen.getByRole('button', { name: 'Gregamilenko' }));
  fireEvent.click(screen.getAllByRole('button', { name: 'Close' })[0]);
  expect(mockInsert).not.toHaveBeenCalled();
  expect(mockSetUserData).not.toHaveBeenCalled();
});

it('keeps the review open and leaves local preferences unchanged on failure', async () => {
  mockInsert.mockResolvedValue({ data: null, error: { message: 'Save failed' } });
  const onLogAdded = jest.fn();
  render(<AddBattleLogInput userData={userData(null)} onLogAdded={onLogAdded} />);
  paste();
  fireEvent.click(screen.getByRole('button', { name: 'Gregamilenko' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
  await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ description: 'Save failed' })));
  expect(screen.getByRole('button', { name: 'Confirm' })).toBeEnabled();
  expect(mockSetUserData).not.toHaveBeenCalled();
  expect(onLogAdded).not.toHaveBeenCalled();
  expect(mockUpdate).not.toHaveBeenCalled();
});

it.each(['response', 'exception'])('handles a saved log with a failed username update (%s) without offering to reimport', async (failure) => {
  if (failure === 'response') mockUpdate.mockResolvedValue({ data: null, error: { message: 'Update failed' } });
  else mockUpdate.mockRejectedValue(new Error('Network failed'));
  const onLogAdded = jest.fn();
  render(<AddBattleLogInput userData={userData(null)} onLogAdded={onLogAdded} />);
  paste();
  fireEvent.click(screen.getByRole('button', { name: 'Gregamilenko' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
  await waitFor(() => expect(onLogAdded).toHaveBeenCalledWith(expect.objectContaining({ id: 'saved' })));
  expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
    title: "Your log was saved, but your username couldn't be updated. Please update it in Preferences.",
  }));
  expect(mockInsert).toHaveBeenCalledTimes(1);
  expect(mockSetUserData).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByPlaceholderText('Paste PTCGL log here')).toHaveValue('');
});
