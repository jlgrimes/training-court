import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { DeckRulesEditor } from '@/components/admin/DeckRulesEditor';

const mutate = jest.fn();
const fetchMock = jest.fn();
jest.mock('swr', () => ({ __esModule: true, default: () => ({ data: [
  { id: 7, card: 'dreepy', second_card: null, archetype: 'dragapult' },
], mutate }) }));
jest.mock('../../components/general-translation/TranslatedText', () => ({
  TranslatedText: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock('../../components/archetype/AddArchetype/AddLimitlessArchetype', () => ({
  AddLimitlessArchetype: ({ archetype, setArchetype }: { archetype: string; setArchetype: (value: string) => void }) =>
    <input role="combobox" value={archetype} onChange={e => setArchetype(e.target.value)} />,
}));
jest.mock('../../components/archetype/AddArchetype/AddArchetype', () => ({
  AddArchetype: ({ archetype, setArchetype }: { archetype: string; setArchetype: (value: string) => void }) =>
    <input aria-label="Deck sprites" value={archetype} onChange={e => setArchetype(e.target.value)} />,
}));
jest.mock('../../components/archetype/sprites/Sprite', () => ({ Sprite: ({ name }: { name: string }) => <span>{name}</span> }));
beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = fetchMock;
  fetchMock.mockResolvedValue({ ok: true });
});

it('saves sprite selections directly as card and deck names', async () => {
  render(<DeckRulesEditor />);
  fireEvent.change(within(screen.getByRole('group', { name: 'Card' })).getByRole('combobox'), { target: { value: 'dreepy' } });
  fireEvent.change(within(screen.getByRole('group', { name: 'Second card (optional)' })).getByRole('combobox'), { target: { value: 'torchic' } });
  fireEvent.change(screen.getByLabelText('Deck sprites'), { target: { value: 'dragapult,blaziken' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save rule' }));
  await waitFor(() => expect(mutate).toHaveBeenCalled());
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toBe('/api/admin/deck-rules');
  expect(options.method).toBe('POST');
  expect(JSON.parse(options.body)).toEqual({ id: null, card: 'dreepy', second_card: 'torchic', archetype: 'dragapult,blaziken' });
});

it('edits a rule and leaves selections available on failure', async () => {
  fetchMock.mockResolvedValue({ ok: false });
  render(<DeckRulesEditor />);
  fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
  expect(within(screen.getByRole('group', { name: 'Card' })).getByRole('combobox')).toHaveValue('dreepy');
  fireEvent.click(screen.getByRole('button', { name: 'Save rule' }));
  await screen.findByRole('alert');
  expect(fetchMock.mock.calls[0][1].method).toBe('PATCH');
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ id: 7, card: 'dreepy', second_card: null, archetype: 'dragapult' });
  expect(screen.getByLabelText('Deck sprites')).toHaveValue('dragapult');
  expect(mutate).not.toHaveBeenCalled();
});
