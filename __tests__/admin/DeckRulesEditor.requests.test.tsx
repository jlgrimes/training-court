import React from 'react';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { DeckRulesEditor } from '@/components/admin/DeckRulesEditor';

jest.mock('../../components/general-translation/TranslatedText', () => ({
  TranslatedText: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock('../../components/archetype/AddArchetype/AddLimitlessArchetype', () => ({ AddLimitlessArchetype: () => null }));
jest.mock('../../components/archetype/AddArchetype/AddArchetype', () => ({ AddArchetype: () => null }));
jest.mock('../../components/archetype/sprites/Sprite', () => ({ Sprite: () => null }));

const fetchMock = jest.fn();
beforeEach(() => { jest.useFakeTimers(); jest.clearAllMocks(); global.fetch = fetchMock; });
afterEach(() => { jest.useRealTimers(); });

async function openEditor() {
  await act(async () => {
    render(<SWRConfig value={{ provider: () => new Map() }}><DeckRulesEditor /></SWRConfig>);
  });
}
async function focusAndWait() {
  await act(async () => {
    window.dispatchEvent(new Event('focus'));
    window.dispatchEvent(new Event('online'));
    jest.advanceTimersByTime(60_000);
  });
}

it('does not repeatedly retry a failing admin request', async () => {
  fetchMock.mockResolvedValue({ ok: false });
  await openEditor();
  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  await focusAndWait();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Retry' })); });
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it('does not refetch successful results on focus or reconnect', async () => {
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
  await openEditor();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  await focusAndWait();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
