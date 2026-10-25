import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Notes } from '@/components/battle-logs/Notes/Notes';
import { createClient } from '../../utils/supabase/client';

jest.mock('../../utils/supabase/client', () => ({ createClient: jest.fn() }));
jest.mock('gt-react', () => ({
  T: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useGT: () => (text: string) => text,
}));

const eq = jest.fn();
const update = jest.fn(() => ({ eq }));
const from = jest.fn(() => ({ update }));
beforeEach(() => {
  jest.clearAllMocks();
  (createClient as jest.Mock).mockReturnValue({ from });
  eq.mockResolvedValue({ error: null });
});

it('shows a compact preview and opens the complete note without saving cancelled edits', () => {
  render(<Notes logId="log-1" serverLoadedNotes={'First line\nSecond line'} />);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(within(screen.getByRole('button', { name: 'Open notes' })).getByText('First line Second line')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Open notes' }));
  const dialog = screen.getByRole('dialog', { name: 'Notes' });
  expect(within(dialog).getByText(/First line/).textContent).toBe('First line\nSecond line');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Edit notes' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Notes' }), { target: { value: 'Unsaved edit' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.queryByRole('textbox')).toBeNull();
  expect(update).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('saves a new note to the correct log and updates the summary', async () => {
  render(<Notes logId="log-2" serverLoadedNotes={null} />);
  fireEvent.click(screen.getByRole('button', { name: 'Open notes' }));
  const textbox = screen.getByRole('textbox', { name: 'Notes' });
  expect(textbox.getAttribute('maxlength')).toBe('500');
  fireEvent.change(textbox, { target: { value: 'Saved note' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(screen.queryByRole('textbox')).toBeNull());
  expect(from).toHaveBeenCalledWith('logs');
  expect(update).toHaveBeenCalledWith({ notes: 'Saved note' });
  expect(eq).toHaveBeenCalledWith('id', 'log-2');
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(within(screen.getByRole('button', { name: 'Open notes' })).getByText('Saved note')).toBeTruthy();
});

it('keeps a failed save editable and preserves the saved preview', async () => {
  eq.mockResolvedValue({ error: { message: 'Save failed' } });
  render(<Notes logId="log-3" serverLoadedNotes="Original" />);
  fireEvent.click(screen.getByRole('button', { name: 'Open notes' }));
  fireEvent.click(screen.getByRole('button', { name: 'Edit notes' }));
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Retry this' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('Retry this');
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(within(screen.getByRole('button', { name: 'Open notes' })).getByText('Original')).toBeTruthy();
});
