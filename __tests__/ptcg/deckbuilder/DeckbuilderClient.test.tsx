import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SWRConfig } from 'swr';

const push = jest.fn();
const replace = jest.fn();
const toast = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
}));

type MockDecklist = {
  id: string;
  name: string;
  user_id: string;
  game: string;
  cards: unknown[];
  content_hash: string | null;
  created_at: string;
  updated_at: string;
  archetype: string | null;
  format: string | null;
};

const makeCard = (overrides: Partial<any> = {}) => ({
  id: 'sv1-001',
  localId: '001',
  name: 'Buddy-Buddy Poffin',
  imageUrlHiRes: 'https://images.test/poffin.png',
  imageUrl: 'https://images.test/poffin-low.png',
  qty: 4,
  order: 0,
  category: 'Trainer',
  metadata: {
    supertype: 'Trainer',
    cardText: ['Search your deck for up to 2 Basic Pokemon with 70 HP or less and put them onto your Bench.'],
    weakness: [],
    resistance: [],
    retreatCost: [],
    rulebox: [],
    ...overrides.metadata,
  },
  ...overrides,
});

const baseDecklist = (overrides: Partial<MockDecklist> = {}): MockDecklist => ({
  id: 'deck-1',
  name: 'Test Deck',
  user_id: 'user-1',
  game: 'pokemon-tcg',
  cards: [makeCard()],
  content_hash: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  archetype: null,
  format: null,
  ...overrides,
});

const dbState: {
  decklists: MockDecklist[];
  tournamentsLinkedCount: number;
  logsLinkedCount: number;
  lastInsert: any;
  lastUpdate: any;
  unlinkedDecklists: Array<{ table: string; decklistId: string | null }>;
  deletedIds: string[];
  decklistReads: Array<{ columns: string; filters: Record<string, unknown>; limit?: number }>;
  deckNamesError: { message: string } | null;
} = {
  decklists: [],
  tournamentsLinkedCount: 0,
  logsLinkedCount: 0,
  lastInsert: null,
  lastUpdate: null,
  unlinkedDecklists: [],
  deletedIds: [],
  decklistReads: [],
  deckNamesError: null,
};

function createQueryBuilder(table: string) {
  const query: any = {
    table,
    operation: 'select',
    payload: undefined,
    countMode: false,
    columns: '*',
    rowLimit: undefined,
    filters: {} as Record<string, unknown>,
    select(columns = '*', options?: { count?: string; head?: boolean }) {
      this.columns = columns;
      if (this.operation === 'select') {
        this.operation = 'select';
      }
      this.countMode = Boolean(options?.count);
      return this;
    },
    insert(payload: any) {
      this.operation = 'insert';
      this.payload = payload;
      return this;
    },
    update(payload: any) {
      this.operation = 'update';
      this.payload = payload;
      return this;
    },
    delete() {
      this.operation = 'delete';
      return this;
    },
    eq(column: string, value: unknown) {
      this.filters[column] = value;
      return this;
    },
    order() {
      return this;
    },
    limit(value: number) {
      this.rowLimit = value;
      return this;
    },
    single() {
      return Promise.resolve(executeQuery(this, true));
    },
    maybeSingle() {
      return Promise.resolve(executeQuery(this, true));
    },
    returns() {
      return Promise.resolve(executeQuery(this, false));
    },
    then(resolve: (value: any) => void, reject: (reason?: any) => void) {
      return Promise.resolve(executeQuery(this, false)).then(resolve, reject);
    },
  };

  return query;
}

function executeQuery(query: any, single: boolean) {
  if (query.table === 'decklists') {
    if (query.operation === 'select' && query.countMode) {
      return { count: dbState.decklists.length, data: null, error: null };
    }

    if (query.operation === 'select') {
      dbState.decklistReads.push({ columns: query.columns, filters: { ...query.filters }, limit: query.rowLimit });
      if (query.columns === 'id,name' && dbState.deckNamesError) {
        return { data: null, error: dbState.deckNamesError };
      }
      const matchingRows = dbState.decklists.filter((decklist) => {
        if (query.filters.user_id && decklist.user_id !== query.filters.user_id) return false;
        if (query.filters.game && decklist.game !== query.filters.game) return false;
        if (query.filters.id && decklist.id !== query.filters.id) return false;
        return true;
      });
      const rows = matchingRows.slice(0, query.rowLimit).map((row) => (
        query.columns === 'id,name' ? { id: row.id, name: row.name } : row
      ));
      return { data: single ? rows[0] ?? null : rows, error: null };
    }

    if (query.operation === 'insert') {
      const row = {
        id: 'deck-created',
        created_at: '2026-01-02T00:00:00.000Z',
        updated_at: query.payload.updated_at,
        archetype: null,
        format: null,
        ...query.payload,
      };
      dbState.lastInsert = query.payload;
      dbState.decklists.unshift(row);
      return { data: single ? row : [row], error: null };
    }

    if (query.operation === 'update') {
      const idx = dbState.decklists.findIndex((decklist) => decklist.id === query.filters.id);
      const row = {
        ...dbState.decklists[idx],
        ...query.payload,
      };
      dbState.lastUpdate = query.payload;
      dbState.decklists[idx] = row;
      return { data: single ? row : [row], error: null };
    }

    if (query.operation === 'delete') {
      dbState.deletedIds.push(query.filters.id as string);
      dbState.decklists = dbState.decklists.filter((decklist) => decklist.id !== query.filters.id);
      return { data: [], error: null };
    }
  }

  if (query.table === 'tournaments') {
    if (query.operation === 'update') {
      dbState.unlinkedDecklists.push({
        table: 'tournaments',
        decklistId: query.filters.decklist_id as string | null,
      });
      return { data: [], error: null };
    }

    return { count: dbState.tournamentsLinkedCount, data: null, error: null };
  }

  if (query.table === 'logs') {
    if (query.operation === 'update') {
      dbState.unlinkedDecklists.push({
        table: 'logs',
        decklistId: query.filters.decklist_id as string | null,
      });
      return { data: [], error: null };
    }

    return { count: dbState.logsLinkedCount, data: null, error: null };
  }

  return { data: [], error: null };
}

jest.doMock('../../../components/ui/use-toast', () => ({
  useToast: () => ({ toast }),
}));

jest.doMock('gt-react', () => ({
  T: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useGT: () => (text: string) => text,
}));

jest.doMock('@/utils/supabase/client', () => ({
  createClient: () => ({
    from: (table: string) => createQueryBuilder(table),
  }),
}), { virtual: true });

jest.doMock('@supabase/ssr', () => ({
  createBrowserClient: () => ({
    from: (table: string) => createQueryBuilder(table),
  }),
}));

const { DeckbuilderClient: ActualDeckbuilderClient } = require('../../../components/ptcg/deckbuilder/DeckbuilderClient') as typeof import('../../../components/ptcg/deckbuilder/DeckbuilderClient');

let swrTestCache = new Map();
const swrProvider = () => swrTestCache;
function DeckbuilderClient(props: React.ComponentProps<typeof ActualDeckbuilderClient>) {
  return (
    <SWRConfig value={{ provider: swrProvider }}>
      <ActualDeckbuilderClient {...props} />
    </SWRConfig>
  );
}

beforeEach(() => {
  swrTestCache = new Map();
  jest.clearAllMocks();
  dbState.decklists = [];
  dbState.tournamentsLinkedCount = 0;
  dbState.logsLinkedCount = 0;
  dbState.lastInsert = null;
  dbState.lastUpdate = null;
  dbState.unlinkedDecklists = [];
  dbState.deletedIds = [];
  dbState.decklistReads = [];
  dbState.deckNamesError = null;

  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    },
    configurable: true,
  });

  Object.assign(navigator, {
    clipboard: {
      readText: jest.fn().mockResolvedValue('decklist text'),
      writeText: jest.fn(),
    },
  });

  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      entries: [makeCard()],
      totalCards: 4,
      unresolved: [],
      parsedLines: 1,
      importedLines: 1,
      code: 200,
    }),
  } as Response);
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function openNewDeckAndImport() {
  render(<DeckbuilderClient userId="user-1" />);
  await screen.findByText('New Deck');
  fireEvent.click(screen.getByText('New Deck'));
  await screen.findByPlaceholderText('Deck name');
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
  });
  await screen.findByText('Cards: 4/60');
}

describe('DeckbuilderClient', () => {
  it('loads all library previews with the existing deck limit', async () => {
    dbState.decklists = [baseDecklist(), baseDecklist({ id: 'deck-2', name: 'Second Deck' })];

    render(<DeckbuilderClient userId="user-1" />);

    await screen.findByText('Test Deck');
    expect(screen.getByText('Second Deck')).toBeVisible();
    expect(screen.getAllByAltText('Buddy-Buddy Poffin')).toHaveLength(2);
    expect(dbState.decklistReads).toEqual([{
      columns: '*', filters: { user_id: 'user-1', game: 'pokemon-tcg' }, limit: 100,
    }]);
  });

  it('fetches only the requested deck, even outside the library limit', async () => {
    dbState.decklists = [
      ...Array.from({ length: 100 }, (_, index) => baseDecklist({ id: `other-${index}` })),
      baseDecklist({ id: 'requested-deck', name: 'Requested Deck' }),
    ];

    render(<DeckbuilderClient userId="user-1" initialDeckId="requested-deck" />);

    await screen.findByDisplayValue('Requested Deck');
    expect(screen.getByText('Cards: 4/60')).toBeVisible();
    expect(dbState.decklistReads).toEqual([{
      columns: '*', filters: { user_id: 'user-1', game: 'pokemon-tcg', id: 'requested-deck' }, limit: undefined,
    }]);
  });

  it('does not fetch saved decks when creating a new deck', async () => {
    await act(async () => {
      render(<DeckbuilderClient userId="user-1" initialDeckId="new" />);
    });

    expect(screen.getByText('Cards: 0/60')).toBeVisible();
    expect(dbState.decklistReads).toEqual([]);
  });

  it.each([
    { id: 'missing-deck' },
    { id: 'private-deck', user_id: 'other-user' },
    { id: 'other-game-deck', game: 'pokemon-pocket' },
  ])('falls back to the library when the requested deck is unavailable: $id', async (unavailableDeck) => {
    dbState.decklists = [baseDecklist()];
    if (unavailableDeck.id !== 'missing-deck') {
      dbState.decklists.push(baseDecklist({ name: 'Unavailable Deck', ...unavailableDeck }));
    }

    render(<DeckbuilderClient userId="user-1" initialDeckId={unavailableDeck.id} />);

    await screen.findByText('Test Deck');
    expect(screen.queryByText('Unavailable Deck')).not.toBeInTheDocument();
    expect(dbState.decklistReads).toEqual([
      { columns: '*', filters: { user_id: 'user-1', game: 'pokemon-tcg', id: unavailableDeck.id }, limit: undefined },
      { columns: '*', filters: { user_id: 'user-1', game: 'pokemon-tcg' }, limit: 100 },
    ]);
  });

  it('loads the next requested deck when the route changes', async () => {
    dbState.decklists = [baseDecklist(), baseDecklist({ id: 'deck-2', name: 'Second Deck' })];
    const { rerender } = render(<DeckbuilderClient userId="user-1" initialDeckId="deck-1" />);
    await screen.findByDisplayValue('Test Deck');

    rerender(<DeckbuilderClient userId="user-1" initialDeckId="deck-2" />);

    await screen.findByDisplayValue('Second Deck');
    expect(dbState.decklistReads.map((query) => query.filters.id)).toEqual(['deck-1', 'deck-2']);
  });

  it('reuses the requested deck when navigating from the library to the editor', async () => {
    dbState.decklists = [baseDecklist(), baseDecklist({ id: 'deck-2', name: 'Second Deck' })];
    const { rerender } = render(<DeckbuilderClient userId="user-1" />);
    await screen.findByText('Test Deck');

    rerender(<DeckbuilderClient userId="user-1" initialDeckId="deck-2" />);

    await screen.findByDisplayValue('Second Deck');
    expect(dbState.decklistReads.map((query) => query.filters.id)).toEqual([undefined]);
  });

  it('reuses library data across component unmounts after clicking a deck', async () => {
    dbState.decklists = [baseDecklist()];
    const library = render(<DeckbuilderClient userId="user-1" />);
    await screen.findByText('Test Deck');
    fireEvent.click(screen.getByText('Test Deck'));
    expect(push).toHaveBeenCalledWith('/ptcg/deckbuilder/deck-1');
    library.unmount();

    render(<DeckbuilderClient userId="user-1" initialDeckId="deck-1" />);

    await screen.findByDisplayValue('Test Deck');
    expect(screen.getByText('Cards: 4/60')).toBeVisible();
    expect(dbState.decklistReads).toHaveLength(1);
  });

  it('fetches a fresh deck when the cached copy is a minute old', async () => {
    dbState.decklists = [baseDecklist()];
    const cachedAt = Date.now();
    const now = jest.spyOn(Date, 'now').mockReturnValue(cachedAt);
    const library = render(<DeckbuilderClient userId="user-1" />);
    await screen.findByText('Test Deck');
    library.unmount();
    now.mockReturnValue(cachedAt + 60_000);
    dbState.decklists[0] = baseDecklist({ name: 'Updated Elsewhere' });

    render(<DeckbuilderClient userId="user-1" initialDeckId="deck-1" />);

    await screen.findByDisplayValue('Updated Elsewhere');
    expect(dbState.decklistReads.map((query) => query.filters.id)).toEqual([undefined, 'deck-1']);
  });

  it('does not reuse a different user\'s cached deck', async () => {
    dbState.decklists = [baseDecklist()];
    const library = render(<DeckbuilderClient userId="user-1" />);
    await screen.findByText('Test Deck');
    library.unmount();
    dbState.decklists = [baseDecklist({ user_id: 'user-2', name: 'Other User Deck' })];

    render(<DeckbuilderClient userId="user-2" initialDeckId="deck-1" />);

    await screen.findByDisplayValue('Other User Deck');
    expect(dbState.decklistReads[1].filters).toEqual({ user_id: 'user-2', game: 'pokemon-tcg', id: 'deck-1' });
  });

  it('updates the shared cache after saving an edited deck', async () => {
    dbState.decklists = [baseDecklist()];
    const editor = render(<DeckbuilderClient userId="user-1" initialDeckId="deck-1" />);
    await screen.findByDisplayValue('Test Deck');
    fireEvent.change(screen.getByPlaceholderText('Deck name'), { target: { value: 'Saved Name' } });
    fireEvent.contextMenu(screen.getByAltText('Buddy-Buddy Poffin').closest('[role="button"]')!);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    });
    expect(dbState.lastUpdate).not.toBeNull();
    editor.unmount();

    render(<DeckbuilderClient userId="user-1" initialDeckId="deck-1" />);

    await screen.findByDisplayValue('Saved Name');
    expect(screen.getByText('Cards: 3/60')).toBeVisible();
    expect(dbState.decklistReads.map(({ columns }) => columns)).toEqual(['*', 'id,name']);
  });

  it('removes a deleted deck from the shared cache', async () => {
    dbState.decklists = [baseDecklist(), baseDecklist({ id: 'deck-2', name: 'Second Deck' })];
    const library = render(<DeckbuilderClient userId="user-1" />);
    await screen.findByText('Test Deck');
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Delete Test Deck'));
    });
    expect(dbState.deletedIds).toEqual(['deck-1']);
    library.unmount();

    render(<DeckbuilderClient userId="user-1" initialDeckId="deck-1" />);

    await screen.findByText('Second Deck');
    expect(screen.queryByDisplayValue('Test Deck')).not.toBeInTheDocument();
    expect(dbState.decklistReads.map((query) => query.filters.id)).toEqual([undefined, 'deck-1', undefined]);
  });

  it('reloads library previews when returning from the editor', async () => {
    dbState.decklists = [baseDecklist(), baseDecklist({ id: 'deck-2', name: 'Second Deck' })];
    const { rerender } = render(<DeckbuilderClient userId="user-1" initialDeckId="deck-1" />);
    await screen.findByDisplayValue('Test Deck');

    rerender(<DeckbuilderClient userId="user-1" />);

    await screen.findByText('Second Deck');
    expect(screen.getByText('Test Deck')).toBeVisible();
    expect(dbState.decklistReads.map((query) => query.filters.id)).toEqual(['deck-1', undefined]);
  });

  it('checks other deck names on save without loading their cards', async () => {
    dbState.decklists = [baseDecklist(), baseDecklist({ id: 'deck-2', name: 'Taken Name' })];
    render(<DeckbuilderClient userId="user-1" initialDeckId="deck-1" />);
    await screen.findByDisplayValue('Test Deck');
    fireEvent.change(screen.getByPlaceholderText('Deck name'), { target: { value: ' taken   name ' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    });

    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Decklist name already exists.' }));
    expect(dbState.lastUpdate).toBeNull();
    expect(dbState.lastInsert).toBeNull();
    expect(dbState.decklistReads.map(({ columns }) => columns)).toEqual(['*', 'id,name']);
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('aborts saving if deck names cannot be checked', async () => {
    dbState.decklists = [baseDecklist()];
    render(<DeckbuilderClient userId="user-1" initialDeckId="deck-1" />);
    await screen.findByDisplayValue('Test Deck');
    dbState.deckNamesError = { message: 'Name lookup failed' };

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    });

    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Unable to save decklist.' }));
    expect(dbState.lastUpdate).toBeNull();
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('uses all saved names when creating a copy of a linked deck', async () => {
    dbState.decklists = [
      baseDecklist(),
      baseDecklist({ id: 'deck-2', name: 'Test Deck Copy' }),
      baseDecklist({ id: 'deck-3', name: 'Test Deck Copy 2' }),
    ];
    dbState.tournamentsLinkedCount = 1;
    render(<DeckbuilderClient userId="user-1" initialDeckId="deck-1" />);
    await screen.findByDisplayValue('Test Deck');
    fireEvent.contextMenu(screen.getByAltText('Buddy-Buddy Poffin').closest('[role="button"]')!);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    });
    await screen.findByText('Save linked decklist?');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Create as new deck' }));
    });

    expect(dbState.lastInsert.name).toBe('Test Deck Copy 3');
    expect(dbState.lastUpdate).toBeNull();
    expect(dbState.decklistReads.filter(({ columns }) => columns === '*')).toHaveLength(1);
  });

  const reportedDeck = [
    [1, 'Air Balloon', 'ASC', '181', 'Trainer'],
    [4, 'Beldum', 'TEF', '113', 'Pokemon'],
    [3, "Boss's Orders", 'MEG', '114', 'Trainer'],
    [4, "Brock's Scouting", 'JTG', '146', 'Trainer'],
    [4, 'Buddy-Buddy Poffin', 'TEF', '144', 'Trainer'],
    [1, 'Community Center', 'TWM', '146', 'Trainer'],
    [4, 'Drilbur', 'PBL', '046', 'Pokemon'],
    [1, 'Energy Recycler', 'DRI', '164', 'Trainer'],
    [2, 'Genesect ex', 'BLK', '067', 'Pokemon'],
    [1, "Hero's Cape", 'TEF', '152', 'Trainer'],
    [2, 'Judge', 'POR', '076', 'Trainer'],
    [2, 'Jumbo Ice Cream', 'PFL', '091', 'Trainer'],
    [1, 'Kieran', 'TWM', '154', 'Trainer'],
    [4, "Lillie's Determination", 'MEG', '119', 'Trainer'],
    [2, 'Mega excadrill ex', 'PBL', '065', 'Pokemon'],
    [1, 'Metagross', 'CRI', '061', 'Pokemon'],
    [15, 'Metal Energy', 'CRZ', '159', 'Energy'],
    [4, 'Metang', 'TEF', '114', 'Pokemon'],
    [3, 'Pokegear 3.0', 'SVI', '186', 'Trainer'],
    [1, 'Switch', 'MEG', '130', 'Trainer'],
  ].map(([qty, name, setCode, number, category]) => makeCard({
    id: `${setCode}-${number}`, localId: number, name, qty, category,
    metadata: { setCode, number, supertype: category, cardText: [], weakness: [], resistance: [], retreatCost: [], rulebox: [] },
  }));

  it.each([false, true])('exports the reported 60-card deck with correct sections (legacy: %s)', async (legacy) => {
    dbState.decklists = [baseDecklist({
      cards: legacy ? reportedDeck.map((card) => ({
        ...card, category: 'Unknown', metadata: { ...card.metadata, supertype: undefined },
      })) : reportedDeck,
    })];
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true, json: async () => ({ entries: reportedDeck, unresolved: [] }),
    });

    render(<DeckbuilderClient userId="user-1" initialDeckId="deck-1" />);
    await screen.findByText('Cards: 60/60');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    const text = (navigator.clipboard.writeText as jest.Mock).mock.calls[0][0] as string;
    const [pokemon, trainers, energy] = text.split(/\n(?=Trainer:|Energy:)/);
    expect(pokemon).toMatch(/^Pokemon: 17\n/);
    expect(trainers).toMatch(/^Trainer: 28\n/);
    expect(energy).toBe('Energy: 15\n15 Metal Energy CRZ 159');
    for (const card of reportedDeck) {
      const section = card.category === 'Pokemon' ? pokemon : card.category === 'Trainer' ? trainers : energy;
      expect(section.split('\n')).toContain(`${card.qty} ${card.name} ${card.metadata.setCode} ${card.localId}`);
    }
    expect(global.fetch).toHaveBeenCalledTimes(legacy ? 1 : 0);
  });

  it('does not copy a misleading export if legacy card categories cannot be resolved', async () => {
    dbState.decklists = [baseDecklist({ cards: [makeCard({ category: 'Unknown', metadata: {} })] })];
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ entries: [] }) });
    render(<DeckbuilderClient userId="user-1" initialDeckId="deck-1" />);
    await screen.findByText('Cards: 4/60');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    });
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith({ title: 'Unable to copy decklist to clipboard.' });
  });

  it('falls back to manual paste import when clipboard text is blocked', async () => {
    (navigator.clipboard.readText as jest.Mock).mockRejectedValueOnce(new Error('NotAllowedError'));

    render(<DeckbuilderClient userId="user-1" />);
    await screen.findByText('New Deck');
    fireEvent.click(screen.getByText('New Deck'));
    await screen.findByPlaceholderText('Deck name');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Import' }));
    });

    expect(await screen.findByText('Paste decklist')).toBeVisible();
    fireEvent.change(screen.getByLabelText('Decklist text'), {
      target: { value: '4 Buddy-Buddy Poffin SV1 001' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Import decklist' }));
    });

    await screen.findByText('Cards: 4/60');
    expect(global.fetch).toHaveBeenCalledWith('/api/ptcg/cards/import', expect.objectContaining({
      body: JSON.stringify({ decklist: '4 Buddy-Buddy Poffin SV1 001' }),
    }));
  });

  it('saves a decklist with cards and a normalized content hash', async () => {
    await openNewDeckAndImport();

    fireEvent.change(screen.getByPlaceholderText('Deck name'), {
      target: { value: 'Poffin Test' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    });

    await waitFor(() => expect(dbState.lastInsert).not.toBeNull());
    expect(dbState.lastInsert.name).toBe('Poffin Test');
    expect(dbState.lastInsert.cards).toHaveLength(1);
    expect(dbState.lastInsert.content_hash).toEqual(expect.any(String));
    expect(dbState.lastInsert.content_hash.length).toBeGreaterThan(0);
  });

  it('warns before editing a decklist that is associated with tournaments or logs', async () => {
    dbState.decklists = [baseDecklist()];
    dbState.tournamentsLinkedCount = 1;
    dbState.logsLinkedCount = 2;

    render(<DeckbuilderClient userId="user-1" initialDeckId="deck-1" />);
    await screen.findByDisplayValue('Test Deck');

    const deckCard = screen.getByAltText('Buddy-Buddy Poffin').closest('[role="button"]');
    expect(deckCard).not.toBeNull();
    fireEvent.contextMenu(deckCard!);
    await screen.findByText('Cards: 3/60');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    });

    expect(await screen.findByText('Save linked decklist?')).toBeVisible();
    expect(screen.getByText(/1 tournament\(s\)/)).toBeVisible();
    expect(screen.getByText(/2 log\(s\)/)).toBeVisible();
    expect(dbState.lastUpdate).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save anyway' }));
    });

    await waitFor(() => expect(dbState.lastUpdate).not.toBeNull());
    expect(dbState.lastUpdate.content_hash).toEqual(expect.any(String));
  });

  it('warns before deleting a decklist that is associated with tournaments or logs', async () => {
    dbState.decklists = [baseDecklist()];
    dbState.tournamentsLinkedCount = 1;

    render(<DeckbuilderClient userId="user-1" />);
    await screen.findByText('Test Deck');

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Delete Test Deck'));
      await Promise.resolve();
    });

    expect(await screen.findByText('Delete linked decklist?')).toBeVisible();
    expect(dbState.deletedIds).toEqual([]);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete anyway' }));
    });

    await waitFor(() => expect(dbState.deletedIds).toEqual(['deck-1']));
    expect(dbState.unlinkedDecklists).toEqual([
      { table: 'tournaments', decklistId: 'deck-1' },
      { table: 'logs', decklistId: 'deck-1' },
    ]);
  });
});
