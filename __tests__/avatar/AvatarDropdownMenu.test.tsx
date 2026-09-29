import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AvatarDropdownMenu } from '@/components/avatar/AvatarDropdownMenu';
import { createClient } from '@/utils/supabase/client';
import { useUserData } from '@/hooks/user-data/useUserData';
import { useRefreshUserData } from '@/hooks/user-data/useRefreshUserData';
import { useToast } from '@/components/ui/use-toast';
import { track } from '@vercel/analytics';

jest.mock('../../utils/supabase/client', () => ({ createClient: jest.fn() }));
jest.mock('../../hooks/user-data/useUserData', () => ({ useUserData: jest.fn() }));
jest.mock('../../hooks/user-data/useRefreshUserData', () => ({ useRefreshUserData: jest.fn() }));
jest.mock('../../components/ui/use-toast', () => ({ useToast: jest.fn() }));
jest.mock('@vercel/analytics', () => ({ track: jest.fn() }));
jest.mock('gt-react', () => ({
  T: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useGT: () => (text: string) => text,
}));
// Keep menu interaction deterministic in jsdom; exercise the real save handler.
jest.mock('../../components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <>{children}</>,
  DropdownMenuItem: ({ children, onSelect, disabled }: any) =>
    <button onClick={onSelect} disabled={disabled}>{children}</button>,
}));

const userId = '74f0efbb-35ca-482c-a2ad-6cfe402dbec9';
const upsert = jest.fn();
const refresh = jest.fn();
const toast = jest.fn();
const props = { userId, images: ['/assets/trainers/nate.png'], initialAvatar: 'alder.png' };

beforeEach(() => {
  jest.clearAllMocks();
  upsert.mockResolvedValue({ error: null });
  refresh.mockResolvedValue(undefined);
  (createClient as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue({ upsert }) });
  (useUserData as jest.Mock).mockReturnValue({ data: { id: userId, avatar: 'alder.png' } });
  (useRefreshUserData as jest.Mock).mockReturnValue(refresh);
  (useToast as jest.Mock).mockReturnValue({ toast });
});

it('displays stored filenames and does not write on mount or profile refresh', () => {
  const { rerender } = render(<AvatarDropdownMenu {...props} />);
  expect(screen.getByRole('button', { name: 'Select an avatar' }).querySelector('img'))
    .toHaveAttribute('src', '/assets/trainers/alder.png');
  (useUserData as jest.Mock).mockReturnValue({ data: { id: userId, avatar: 'nate.png' } });
  rerender(<AvatarDropdownMenu {...props} />);
  expect(screen.getByRole('button', { name: 'Select an avatar' }).querySelector('img'))
    .toHaveAttribute('src', '/assets/trainers/nate.png');
  expect(upsert).not.toHaveBeenCalled();
});

it('saves the filename under avatar and refreshes using the user UUID', async () => {
  render(<AvatarDropdownMenu {...props} />);
  fireEvent.click(screen.getByRole('button', { name: 'nate' }));
  await waitFor(() => expect(refresh).toHaveBeenCalledWith(userId));
  expect(upsert).toHaveBeenCalledTimes(1);
  expect(upsert).toHaveBeenCalledWith({ id: userId, avatar: 'nate.png' });
  expect(screen.getByRole('button', { name: 'Select an avatar' }).querySelector('img'))
    .toHaveAttribute('src', '/assets/trainers/nate.png');
  expect(track).toHaveBeenCalledWith('Avatar changed', { avatar: 'nate.png' });
});

it('retains the saved avatar and reports a rejected database write', async () => {
  const error = { code: '22P02', message: 'invalid input syntax for type uuid: "nate.png"' };
  upsert.mockResolvedValue({ error });
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    render(<AvatarDropdownMenu {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'nate' }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' })));
    expect(screen.getByRole('button', { name: 'Select an avatar' }).querySelector('img'))
      .toHaveAttribute('src', '/assets/trainers/alder.png');
    expect(refresh).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith('Failed to save avatar', error);
  } finally {
    consoleError.mockRestore();
  }
});

it('prevents overlapping saves while a write is pending', async () => {
  let finish!: (result: { error: null }) => void;
  upsert.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  render(<AvatarDropdownMenu {...props} />);
  fireEvent.click(screen.getByRole('button', { name: 'nate' }));
  expect(screen.getByRole('button', { name: 'Select an avatar' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'nate' }));
  expect(upsert).toHaveBeenCalledTimes(1);
  finish({ error: null });
  await waitFor(() => expect(screen.getByRole('button', { name: 'Select an avatar' })).toBeEnabled());
});
