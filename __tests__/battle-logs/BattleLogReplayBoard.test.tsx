import { replayCardKey } from '@/components/battle-logs/Replay/card-identity';
import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';
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
  const cardsByKey = Object.fromEntries(names.map((name) => [replayCardKey({ name }), { id: name, name, imageUrl: `https://example.com/${encodeURIComponent(name)}.png` }]));
  render(<ReplayBoard board={replay.frames.at(-1)!.board} perspectivePlayer="Bassoonboy135" cardsByKey={cardsByKey} />);
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
  render(<ReplayBoard board={board} perspectivePlayer="Bassoonboy135" cardsByKey={{
    [replayCardKey({ name: 'Basic Fighting Energy' })]: { id: 'energy', name: 'Basic Fighting Energy', imageUrl: 'https://example.com/energy.png' },
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
  fireEvent.click(screen.getByRole('button', { name: 'Play' }));
  expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Action details' }));
  const dialog = screen.getByRole('dialog', { name: 'Current action' });
  expect(within(dialog).getByText('A long explanation belongs in the overlay.')).toBeTruthy();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
  expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy();
  expect(screen.queryByRole('dialog')).toBeNull();
});


it('requests exact identifiers and keeps different printings separate in the hand', async () => {
  const log = parseBattleLog(battleLogNewStructure, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  log.sections = [{ ...log.sections[0], actions: [{ title: 'Bassoonboy135 drew 2 cards.', details: ['- (mee_5) Basic Psychic Energy, (mee_13) Basic Psychic Energy'] }] }];
  const originalFetch = global.fetch;
  const fetchMock = jest.fn(async (url: string) => {
    const identifier = new URL(url, 'http://localhost').searchParams.get('identifier');
    return { ok: true, json: async () => ({ cards: [{ id: identifier, name: 'Psychic Energy', imageUrl: `https://example.com/${identifier}.png` }], code: 200 }) };
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  try {
    render(<BattleLogReplayViewer battleLog={log} />);
    const images = await screen.findAllByAltText('Basic Psychic Energy');
    expect(images.map((image) => image.getAttribute('src')).sort()).toEqual(['https://example.com/mee_13.png', 'https://example.com/mee_5.png']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const [url] of fetchMock.mock.calls) {
      const params = new URL(url, 'http://localhost').searchParams;
      expect(params.has('identifier')).toBe(true);
      expect(params.get('query')).toBe('Basic Psychic Energy');
    }
  } finally {
    global.fetch = originalFetch;
  }
});

it('does not search by name when an identifier has no catalog match', async () => {
  const log = parseBattleLog(battleLogNewStructure, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  log.sections = [{ ...log.sections[0], actions: [{ title: 'Bassoonboy135 drew (missing_5) Basic Psychic Energy.', details: [] }] }];
  const originalFetch = global.fetch;
  const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ cards: [], code: 200 }) });
  global.fetch = fetchMock;
  try {
    render(<BattleLogReplayViewer battleLog={log} />);
    await screen.findByText('Basic Psychic Energy');
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const params = new URL(fetchMock.mock.calls[0][0], 'http://localhost').searchParams;
    expect(params.get('identifier')).toBe('missing_5');
    expect(params.get('query')).toBe('Basic Psychic Energy');
    expect(screen.queryByAltText('Basic Psychic Energy')).toBeNull();
  } finally {
    global.fetch = originalFetch;
  }
});
