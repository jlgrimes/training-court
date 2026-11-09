import { fireEvent, render, screen, within } from '@testing-library/react';
import { BattleLogReplayViewer } from '@/components/battle-logs/Replay/BattleLogReplayViewer';
import type { BattleLog, BattleLogAction } from '@/components/battle-logs/utils/battle-log.types';

jest.mock('gt-react', () => ({ T: ({ children }: { children: React.ReactNode }) => <>{children}</>, useGT: () => (text: string) => text }));
jest.mock('swr', () => ({ __esModule: true, default: () => ({ data: {} }) }));
beforeEach(() => {
  jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1000);
  jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(700);
  jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(650);
});
afterEach(() => jest.restoreAllMocks());
const log = (actions: BattleLogAction[]): BattleLog => ({
  id: 'evidence', language: 'en', date: '2026-01-01', winner: 'You',
  players: ['You', 'Opponent'].map((name) => ({ name, deck: undefined, oppDeck: undefined, result: name === 'You' ? 'W' : 'L' })),
  sections: [{ turnTitle: "You's Turn", player: 'You', body: '', prizesAfterTurn: {}, actions }],
});

it('keeps reconstruction evidence available without putting question marks on cards', () => {
  render(<BattleLogReplayViewer battleLog={log([
    { title: 'You played Munkidori to the Bench.', details: [] },
    { title: 'You played Munkidori to the Bench.', details: [] },
    { title: 'You attached Basic Darkness Energy to Munkidori on the Bench.', details: [] },
  ])} />);
  expect(screen.queryByRole('status')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'End' }));
  const notice = screen.getByRole('status');
  const board = screen.getByRole('region', { name: 'Replay board' });
  expect(board.contains(notice)).toBe(true);
  const note = notice.querySelector('details')!;
  expect(note.hasAttribute('open')).toBe(false);
  fireEvent.click(within(notice).getByText('Multiple possible boards'));
  expect(note.hasAttribute('open')).toBe(true);
  expect(notice.textContent).toContain('Multiple possible boards');
  expect(notice.textContent).toContain('The log does not distinguish which Pokémon copy gained or lost the attached card.');
  expect(notice.textContent).toContain('Frame 3: You attached Basic Darkness Energy to Munkidori on the Bench.');
  expect(screen.queryByText('?')).toBeNull();
  expect(document.querySelectorAll('[data-knowledge="ambiguous"]')).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: 'Action details' }));
  const dialog = screen.getByRole('dialog', { name: 'Current action' });
  expect(within(dialog).getByText('Multiple card assignments remain compatible with the log.')).toBeTruthy();
});

it('removes the board note when returning to a frame without ambiguity', () => {
  render(<BattleLogReplayViewer battleLog={log([
    { title: 'You played Munkidori to the Bench.', details: [] },
    { title: 'You played Munkidori to the Bench.', details: [] },
    { title: 'You attached Basic Darkness Energy to Munkidori on the Bench.', details: [] },
  ])} />);
  fireEvent.click(screen.getByRole('button', { name: 'End' }));
  expect(within(screen.getByRole('region', { name: 'Replay board' })).getByRole('status')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Start' }));
  expect(screen.queryByRole('status')).toBeNull();
});

it('shows inferred hand cards without a knowledge checkbox', () => {
  render(<BattleLogReplayViewer battleLog={log([
    { title: 'You drew a card.', details: [] }, { title: 'You played Ultra Ball.', details: [] },
  ])} />);
  const player = screen.getByRole('region', { name: 'You' });
  const hand = player.querySelector<HTMLElement>('[data-zone="hand"]')!;
  expect(within(hand).getByRole('button', { name: 'Ultra Ball' })).toBeTruthy();
  expect(screen.queryByRole('checkbox')).toBeNull();
  expect(screen.queryByText('Show hand cards inferred from later actions')).toBeNull();
});

it.each([
  ["You put 2 damage counters on You's Munkidori.", 'The log does not distinguish which Pokémon copy gained or lost damage.'],
  ["You's Munkidori is now in the Active Spot.", 'The log does not distinguish which Pokémon copy moved to the Active Spot.'],
])('explains the specific ambiguity for %s', (title, explanation) => {
  render(<BattleLogReplayViewer battleLog={log([
    { title: 'You played Munkidori to the Bench.', details: [] },
    { title: 'You played Munkidori to the Bench.', details: [] },
    { title, details: [] },
    { title: 'You drew a card.', details: [] },
  ])} />);
  fireEvent.click(screen.getByRole('button', { name: 'End' }));
  const notice = screen.getByRole('status');
  expect(notice.textContent).toContain(explanation);
  expect(notice.textContent).toContain(`Frame 3: ${title}`);
  expect(notice.textContent).not.toContain('which Pokémon copy gained or lost the attached card');
});

it('exposes the unsupported line and its original location in the action review', () => {
  const input = log([{ title: 'An unfamiliar field effect changed all cards.', details: [] }]);
  input.sourceText = 'Setup\nAn unfamiliar field effect changed all cards.';
  render(<BattleLogReplayViewer battleLog={input} />);
  expect(screen.queryByRole('status')).toBeNull();
  expect(screen.queryByText('Partial reconstruction')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Action details' }));
  expect(screen.getByText('This line could not be reconstructed.')).toBeTruthy();
  expect(screen.getAllByText(/Line 2:/).length).toBeGreaterThan(0);
});

