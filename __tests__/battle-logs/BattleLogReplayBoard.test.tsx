import { fireEvent, render, screen, within } from '@testing-library/react';
import { BattleLogReplayViewer, ReplayBoard } from '@/components/battle-logs/Replay/BattleLogReplayViewer';
import { buildBattleLogReplay } from '@/components/battle-logs/Replay/battle-log-replay.utils';
import { parseBattleLog } from '@/components/battle-logs/utils/battle-log.utils';
import { battleLogNewStructure } from '@/components/battle-logs/utils/testing-files/battleLogNewStructure';

jest.mock('gt-react', () => ({
  T: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useGT: () => (text: string) => text,
}));

it('renders stadium and every attached card as images on both sides of the board', () => {
  const log = parseBattleLog(battleLogNewStructure, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  log.sections = [{ ...log.sections[0], actions: [
    { title: 'Bassoonboy135 played Solrock to the Active Spot.', details: [] },
    { title: 'Player2 played Froakie to the Bench.', details: [] },
    { title: 'Bassoonboy135 attached Basic Fighting Energy to Solrock in the Active Spot.', details: [] },
    { title: 'Bassoonboy135 attached Basic Fighting Energy to Solrock in the Active Spot.', details: [] },
    { title: 'Player2 attached Air Balloon to Froakie on the Bench.', details: [] },
    { title: 'Player2 played Grand Tree to the Stadium spot.', details: [] },
  ] }];
  const replay = buildBattleLogReplay(log);
  const names = ['Solrock', 'Froakie', 'Basic Fighting Energy', 'Air Balloon', 'Grand Tree'];
  const cardsByName = Object.fromEntries(names.map((name) => [name, { id: name, name, imageUrl: `https://example.com/${encodeURIComponent(name)}.png` }]));
  render(<ReplayBoard board={replay.frames.at(-1)!.board} perspectivePlayer="Bassoonboy135" cardsByName={cardsByName} />);
  expect(screen.getAllByAltText('Basic Fighting Energy')).toHaveLength(2);
  expect(screen.getByAltText('Air Balloon').getAttribute('src')).toContain('Air%20Balloon');
  expect(screen.getByAltText('Grand Tree').getAttribute('src')).toContain('Grand%20Tree');
});

it('loads Poke Pad artwork for a replay card named Poké Pad', async () => {
  const log = parseBattleLog(battleLogNewStructure, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  log.sections = [{ ...log.sections[0], actions: [{ title: 'Bassoonboy135 drew Poké Pad.', details: [] }] }];
  const originalFetch = global.fetch;
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ cards: [{ id: 'ASC-198', name: 'Poke Pad', imageUrlHiRes: 'https://example.com/poke-pad.png' }], code: 200 }),
  });
  global.fetch = fetchMock;
  try {
    render(<BattleLogReplayViewer battleLog={log} />);
    const image = await screen.findByAltText('Poké Pad');
    expect(image.getAttribute('src')).toBe('https://example.com/poke-pad.png');
    const params = new URL(fetchMock.mock.calls[0][0], 'http://localhost').searchParams;
    expect(params.get('query')).toBe('Poké Pad');
    expect(params.get('exactName')).toBe('true');
  } finally {
    global.fetch = originalFetch;
  }
});

it('stacks duplicate hand cards, masks the opponent hand, and opens visible cards for inspection', () => {
  const log = parseBattleLog(battleLogNewStructure, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  const board = buildBattleLogReplay(log).frames[0].board;
  board.players.Bassoonboy135.hand.knownCards = [
    { id: 'energy-1', name: 'Basic Fighting Energy', known: true },
    { id: 'energy-2', name: 'Basic Fighting Energy', known: true },
    { id: 'ball', name: 'Nest Ball', known: true },
  ];
  board.players.Bassoonboy135.hand.unknownCount = 1;
  board.players.Player2.hand.knownCards = [{ id: 'secret', name: 'Arven', known: true }];
  board.players.Player2.hand.unknownCount = 2;
  render(<ReplayBoard board={board} perspectivePlayer="Bassoonboy135" cardsByName={{
    'Basic Fighting Energy': { id: 'energy', name: 'Basic Fighting Energy', imageUrl: 'https://example.com/energy.png' },
  }} />);

  const hand = screen.getByRole('region', { name: 'Bassoonboy135' }).querySelector('[data-zone="hand"]') as HTMLElement;
  const energy = within(hand).getByRole('button', { name: 'Basic Fighting Energy' });
  expect(within(energy).getByText('2')).toBeTruthy();
  expect(within(hand).getAllByAltText('Basic Fighting Energy')).toHaveLength(1);
  expect(screen.queryByRole('button', { name: 'Arven' })).toBeNull();
  expect(screen.getAllByText('Deck')).toHaveLength(2);

  fireEvent.click(energy);
  const dialog = screen.getByRole('dialog', { name: 'Basic Fighting Energy' });
  expect(within(dialog).getByAltText('Basic Fighting Energy').getAttribute('src')).toBe('https://example.com/energy.png');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('opens action details in an overlay and pauses playback while reading', () => {
  const log = parseBattleLog(battleLogNewStructure, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  log.sections = [{ ...log.sections[0], actions: [
    { title: 'An action happened.', details: ['A long explanation belongs in the overlay.'] },
    { title: 'The next action happened.', details: [] },
  ] }];
  render(<BattleLogReplayViewer battleLog={log} />);
  fireEvent.click(screen.getByRole('button', { name: 'Play', exact: true }));
  expect(screen.getByRole('button', { name: 'Pause', exact: true })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Action details', exact: true }));
  const dialog = screen.getByRole('dialog', { name: 'Current action' });
  expect(within(dialog).getByText('A long explanation belongs in the overlay.')).toBeTruthy();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
  expect(screen.getByRole('button', { name: 'Play', exact: true })).toBeTruthy();
  expect(screen.queryByRole('dialog')).toBeNull();
});
