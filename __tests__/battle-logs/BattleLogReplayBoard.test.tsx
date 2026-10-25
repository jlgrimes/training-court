import { SWRConfig } from 'swr';
import { readFileSync } from 'fs';
import { replayCardKey } from '@/components/battle-logs/Replay/card-identity';
import { act, fireEvent, render as renderUI, screen, within, waitFor } from '@testing-library/react';
import { BattleLogReplayViewer, ReplayBoard } from '@/components/battle-logs/Replay/BattleLogReplayViewer';
import { buildBattleLogReplay } from '@/components/battle-logs/Replay/battle-log-replay.utils';
import { parseBattleLog } from '@/components/battle-logs/utils/battle-log.utils';
import { battleLogNewStructure } from '@/components/battle-logs/utils/testing-files/battleLogNewStructure';

jest.mock('gt-react', () => ({
  T: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useGT: () => (text: string, values: Record<string, string | number> = {}) =>
    text.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match)),
}));


const render = (ui: React.ReactElement) => renderUI(ui, {
  wrapper: ({ children }) => <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>{children}</SWRConfig>,
});

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
    json: async () => ({ cardsByKey: { [replayCardKey({ name: 'Poke Pad' })]: { id: 'ASC-198', name: 'Poke Pad', imageUrlHiRes: 'https://example.com/poke-pad.png' } } }),
  });
  global.fetch = fetchMock;
  try {
    render(<BattleLogReplayViewer battleLog={log} />);
    const image = await screen.findByAltText('Poké Pad');
    expect(image.getAttribute('src')).toBe('https://example.com/poke-pad.png');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.cards).toEqual([expect.objectContaining({ name: 'Pok\u00e9 Pad' })]);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/ptcg/cards/replay');
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
  const fetchMock = jest.fn(async (_url: string, options: RequestInit) => {
    const { cards } = JSON.parse(options.body as string);
    return { ok: true, json: async () => ({ cardsByKey: Object.fromEntries(cards.map((card: { name: string; identifier: string }) => [replayCardKey(card), {
      id: card.identifier, name: 'Psychic Energy', imageUrl: `https://example.com/${card.identifier}.png`,
    }])) }) };
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  try {
    render(<BattleLogReplayViewer battleLog={log} />);
    const images = await screen.findAllByAltText('Basic Psychic Energy');
    expect(images.map((image) => image.getAttribute('src')).sort()).toEqual(['https://example.com/mee_13.png', 'https://example.com/mee_5.png']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.cards).toEqual([
      { name: 'Basic Psychic Energy', identifier: 'mee_13' },
      { name: 'Basic Psychic Energy', identifier: 'mee_5' },
    ]);
  } finally {
    global.fetch = originalFetch;
  }
});

it('does not search by name when an identifier has no catalog match', async () => {
  const log = parseBattleLog(battleLogNewStructure, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  log.sections = [{ ...log.sections[0], actions: [{ title: 'Bassoonboy135 drew (missing_5) Basic Psychic Energy.', details: [] }] }];
  const originalFetch = global.fetch;
  const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ cardsByKey: { 'id:missing_5': null } }) });
  global.fetch = fetchMock;
  try {
    render(<BattleLogReplayViewer battleLog={log} />);
    await screen.findByText('Basic Psychic Energy');
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.cards).toEqual([{ name: 'Basic Psychic Energy', identifier: 'missing_5' }]);
    expect(screen.queryByAltText('Basic Psychic Energy')).toBeNull();
  } finally {
    global.fetch = originalFetch;
  }
});


it('opens every discarded card, preserves duplicates, and lets cards be inspected', () => {
  const log = parseBattleLog(battleLogNewStructure, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  const board = buildBattleLogReplay(log).frames[0].board;
  board.players.Bassoonboy135.discard = [
    { id: 'stretcher-1', name: 'Night Stretcher', identifier: 'sv8_251', known: true },
    { id: 'stretcher-2', name: 'Night Stretcher', identifier: 'sv8_251', known: true },
    { id: 'energy', name: 'Basic Psychic Energy', identifier: 'sve_21_ph', known: true },
  ];
  board.players.Player2.discard = [{ id: 'opponent-ball', name: 'Ultra Ball', known: true }];
  render(<ReplayBoard board={board} perspectivePlayer="Bassoonboy135" cardsByKey={{
    'id:sv8_251': { id: 'sv8_251', name: 'Night Stretcher', imageUrl: 'https://example.com/stretcher.png' },
    'id:sve_21_ph': { id: 'sve_21', name: 'Basic Psychic Energy', imageUrl: '/images/replay/sve-021.png' },
  }} />);
  const trigger = screen.getByRole('button', { name: 'Bassoonboy135: Discard' });
  expect(within(trigger).getByText('3')).toBeTruthy();
  fireEvent.click(trigger);
  const discard = screen.getByRole('dialog', { name: 'Bassoonboy135: Discard (3)' });
  expect(within(discard).getAllByRole('button', { name: 'Night Stretcher' })).toHaveLength(2);
  expect(within(discard).getByRole('button', { name: 'Basic Psychic Energy' })).toBeTruthy();
  expect(within(discard).queryByRole('button', { name: 'Ultra Ball' })).toBeNull();
  fireEvent.click(within(discard).getAllByRole('button', { name: 'Night Stretcher' })[0]);
  const inspection = screen.getByRole('dialog', { name: 'Night Stretcher' });
  expect(within(inspection).getByAltText('Night Stretcher').getAttribute('src')).toBe('https://example.com/stretcher.png');
  fireEvent.click(within(inspection).getByRole('button', { name: 'Close' }));
  expect(screen.getByRole('dialog', { name: 'Bassoonboy135: Discard (3)' })).toBeTruthy();
  fireEvent.click(within(discard).getByRole('button', { name: 'Close' }));
  fireEvent.click(screen.getByRole('button', { name: 'Player2: Discard' }));
  const opponentDiscard = screen.getByRole('dialog', { name: 'Player2: Discard (1)' });
  expect(within(opponentDiscard).getByRole('button', { name: 'Ultra Ball' })).toBeTruthy();
  expect(within(opponentDiscard).queryByRole('button', { name: 'Night Stretcher' })).toBeNull();
});

it('opens an empty discard pile', () => {
  const log = parseBattleLog(battleLogNewStructure, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  const board = buildBattleLogReplay(log).frames[0].board;
  board.players.Bassoonboy135.discard = [];
  render(<ReplayBoard board={board} perspectivePlayer="Bassoonboy135" cardsByKey={{}} />);
  fireEvent.click(screen.getByRole('button', { name: 'Bassoonboy135: Discard' }));
  const discard = screen.getByRole('dialog', { name: 'Bassoonboy135: Discard (0)' });
  expect(within(discard).getByText('Empty')).toBeTruthy();
  fireEvent.click(within(discard).getByRole('button', { name: 'Close' }));
  expect(screen.queryByRole('dialog')).toBeNull();
});


it('shows both final mulligan totals in the bonus-draw action and its details', async () => {
  const raw = readFileSync('__tests__/battle-logs/fixtures/dragapult-identifiers.txt', 'utf8').replace(/\r\n/g, '\n');
  const log = parseBattleLog(raw, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  const bonusIndex = buildBattleLogReplay(log).frames.findIndex((frame) => !!frame.event.mulliganBonus);
  await act(async () => { render(<BattleLogReplayViewer battleLog={log} />); });
  for (let index = 0; index < bonusIndex; index++) fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  const expected = 'Bassoonboy135 drew 3 bonus cards because Oyauguru took 4 mulligans and Bassoonboy135 took 1.';
  expect(screen.getByText(expected)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Action details' }));
  expect(within(screen.getByRole('dialog', { name: 'Current action' })).getByText(expected)).toBeTruthy();
});


it('shows a 10 damage badge on Munkidori after Itchy Pollen', () => {
  const raw = readFileSync('__tests__/battle-logs/fixtures/dragapult-identifiers.txt', 'utf8').replace(/\r\n/g, '\n');
  const log = parseBattleLog(raw, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  const hit = buildBattleLogReplay(log).frames.find((frame) => frame.event.title.includes('Itchy Pollen on Bassoonboy135'))!;
  render(<ReplayBoard board={hit.board} perspectivePlayer="Bassoonboy135" cardsByKey={{}} />);
  const player = screen.getByRole('region', { name: 'Bassoonboy135' });
  const munkidori = within(player).getByRole('button', { name: 'Munkidori' }).parentElement!;
  expect(within(munkidori).getByText('Damage:')).toBeTruthy();
  expect(within(munkidori).getByText('10')).toBeTruthy();
});


it('shows a 20 damage badge on Budew when Risky Ruins places two counters', () => {
  const raw = readFileSync('__tests__/battle-logs/fixtures/dragapult-identifiers.txt', 'utf8').replace(/\r\n/g, '\n');
  const log = parseBattleLog(raw, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  const played = buildBattleLogReplay(log).frames.find((frame) => frame.event.title === 'Bassoonboy135 played (sv8-5_4_mph) Budew to the Bench.')!;
  render(<ReplayBoard board={played.board} perspectivePlayer="Bassoonboy135" cardsByKey={{}} />);
  const player = screen.getByRole('region', { name: 'Bassoonboy135' });
  const budew = within(player).getByRole('button', { name: 'Budew' }).parentElement!;
  expect(within(budew).getByText('20')).toBeTruthy();
});

it('moves the visible damage badge between sides after Adrena-Brain', () => {
  const raw = readFileSync('__tests__/battle-logs/fixtures/dragapult-identifiers.txt', 'utf8').replace(/\r\n/g, '\n');
  const log = parseBattleLog(raw, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  const { frames } = buildBattleLogReplay(log);
  const index = frames.findIndex((frame) => frame.event.title.endsWith('used Adrena-Brain.'));
  const { rerender } = render(<ReplayBoard board={frames[index - 1].board} perspectivePlayer="Bassoonboy135" cardsByKey={{}} />);
  const budew = (owner: string) => within(screen.getByRole('region', { name: owner })).getByRole('button', { name: 'Budew' }).parentElement!;
  expect(within(budew('Bassoonboy135')).getByText('20')).toBeTruthy();
  expect(within(budew('Oyauguru')).queryByText('Damage:')).toBeNull();
  rerender(<ReplayBoard board={frames[index].board} perspectivePlayer="Bassoonboy135" cardsByKey={{}} />);
  expect(within(budew('Bassoonboy135')).queryByText('Damage:')).toBeNull();
  expect(within(budew('Oyauguru')).getByText('20')).toBeTruthy();
});

it('shows the Risky Ruins damage badge on the newly played second Dreepy', () => {
  const raw = readFileSync('__tests__/battle-logs/fixtures/dragapult-identifiers.txt', 'utf8').replace(/\r\n/g, '\n');
  const log = parseBattleLog(raw, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  const frame = buildBattleLogReplay(log).frames.find((frame) => frame.event.title === 'Bassoonboy135 played (me2-5_158) Dreepy to the Bench.')!;
  render(<ReplayBoard board={frame.board} perspectivePlayer="Bassoonboy135" cardsByKey={{}} />);
  const player = screen.getByRole('region', { name: 'Bassoonboy135' });
  const dreepy = within(player).getAllByRole('button', { name: 'Dreepy' }).map((button) => button.parentElement!);
  expect(dreepy).toHaveLength(2);
  expect(within(dreepy[0]).queryByText('Damage:')).toBeNull();
  expect(within(dreepy[1]).getByText('20')).toBeTruthy();
});


it('keeps the current frame when entering and leaving full-screen replay', () => {
  const log = parseBattleLog(battleLogNewStructure, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  log.sections = [{ ...log.sections[0], actions: [
    { title: 'First action.', details: [] }, { title: 'Second action.', details: [] },
  ] }];
  const previousOverflow = document.body.style.overflow;
  render(<BattleLogReplayViewer battleLog={log} />);
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  fireEvent.click(screen.getByRole('button', { name: 'Full-screen replay' }));
  expect(screen.getByText('Second action.')).toBeTruthy();
  expect(document.body.style.overflow).toBe('hidden');
  expect(screen.getByRole('button', { name: 'Exit full screen' }).getAttribute('aria-pressed')).toBe('true');
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.getByText('Second action.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Full-screen replay' })).toBeTruthy();
  expect(document.body.style.overflow).toBe(previousOverflow);
});


it('keeps playback position when a parent re-renders the same log on window focus', () => {
  const log = parseBattleLog(battleLogNewStructure, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  log.sections = [{ ...log.sections[0], actions: [
    { title: 'First action.', details: [] }, { title: 'Second action.', details: [] },
  ] }];
  const { rerender } = render(<BattleLogReplayViewer battleLog={log} />);
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  rerender(<BattleLogReplayViewer battleLog={JSON.parse(JSON.stringify(log))} />);
  fireEvent(window, new Event('focus'));
  expect(screen.getByText('Second action.')).toBeTruthy();
  rerender(<BattleLogReplayViewer battleLog={{ ...log, id: 'another-log' }} />);
  expect(screen.getByText('First action.')).toBeTruthy();
});
