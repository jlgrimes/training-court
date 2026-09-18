// Imports a Pocket tournament from a Limitless tournament link.
//
// The user pastes a link like:
//   https://play.limitlesstcg.com/tournament/<id>/player/<player>
// and we use the public Limitless API (https://play.limitlesstcg.com/api)
// to pull that player's results and turn them into a Pocket tournament with
// one round per match. The actual database writes happen client-side (with the
// user's authenticated Supabase session); this route only fetches + parses.

const LIMITLESS_API_BASE = 'https://play.limitlesstcg.com/api';

// Formats supported by Pocket tournaments in this app. Used to map the
// Limitless tournament format onto one of ours when it lines up.
const POCKET_FORMATS = [
  'A1', 'A1a', 'A2', 'A2a', 'A2b', 'A3', 'A3a', 'A3b', 'A4', 'A4a', 'A4b', 'B1',
];

type LimitlessRecord = {
  wins?: number;
  losses?: number;
  ties?: number;
};

type LimitlessStanding = {
  player?: string;
  name?: string;
  placing?: number;
  record?: LimitlessRecord;
  // The deck archetype shape isn't strongly documented and varies by game, so
  // we read it defensively in extractDeckIcons below.
  deck?: unknown;
  decklist?: unknown;
};

type LimitlessPairing = {
  round?: number;
  phase?: number;
  table?: number;
  match?: string;
  winner?: string | null;
  player1?: string | null;
  player2?: string | null;
};

type LimitlessDetails = {
  id?: string;
  name?: string;
  date?: string;
  game?: string;
  format?: string;
};

export type ImportedRound = {
  round_num: number;
  result: string[];
  deck: string | null;
  match_end_reason: string | null;
  turn_orders: string[];
};

export type ImportPocketTournamentResponse = {
  tournament: {
    name: string;
    date: string;
    format: string | null;
    placement: string | null;
    deck: string | null;
  };
  player: { id: string; name: string };
  rounds: ImportedRound[];
  unmatchedDecks: number;
  code: number;
};

// Pulls the tournament id and (optional) player handle out of a Limitless URL.
const parseLimitlessUrl = (
  rawUrl: string
): { tournamentId: string; playerId: string | null } | null => {
  let url = rawUrl.trim();
  if (!url) return null;

  // Allow pasting without a protocol.
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  let pathname: string;
  try {
    const parsed = new URL(url);
    if (!/limitlesstcg\.com$/i.test(parsed.hostname)) return null;
    pathname = parsed.pathname;
  } catch {
    return null;
  }

  // Matches /tournament/<id> or /tournaments/<id>, optionally /player/<handle>.
  const match = pathname.match(
    /\/tournaments?\/([^/?#]+)(?:\/player\/([^/?#]+))?/i
  );
  if (!match) return null;

  return {
    tournamentId: decodeURIComponent(match[1]),
    playerId: match[2] ? decodeURIComponent(match[2]) : null,
  };
};

const fetchLimitless = async (path: string): Promise<any> => {
  const response = await fetch(`${LIMITLESS_API_BASE}${path}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'training-court',
    },
    // Tournament results don't change often once finished; let Next cache.
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    const error: any = new Error(`Limitless API returned ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
};

// Limitless represents archetypes as one or more sprite "icons" (e.g. ["mewtwo",
// "gardevoir"]). Our app stores decks as a comma-separated list of up to two of
// those same sprite names, so we just need to normalize whatever shape we get.
const extractDeckIcons = (entry: unknown): string[] => {
  if (!entry) return [];

  const fromValue = (value: unknown): string[] => {
    if (typeof value === 'string') {
      return value.trim() ? [value.trim()] : [];
    }
    if (Array.isArray(value)) {
      return value
        .map((item) =>
          typeof item === 'string'
            ? item
            : typeof (item as any)?.name === 'string'
              ? (item as any).name
              : typeof (item as any)?.icon === 'string'
                ? (item as any).icon
                : ''
        )
        .filter((name): name is string => Boolean(name));
    }
    if (typeof value === 'object' && value !== null) {
      const obj = value as Record<string, unknown>;
      if (Array.isArray(obj.icons)) return fromValue(obj.icons);
      if (typeof obj.icon === 'string') return fromValue(obj.icon);
    }
    return [];
  };

  const icons = fromValue(entry);
  return Array.from(
    new Set(icons.map((name) => name.toLowerCase().trim()).filter(Boolean))
  ).slice(0, 2);
};

const deckIconsToArchetype = (icons: string[]): string | null =>
  icons.length > 0 ? icons.join(',') : null;

// Maps a numeric finish onto the app's placement buckets.
const mapPlacement = (placing: number | undefined): string | null => {
  if (!placing || placing < 1) return null;
  if (placing === 1) return 'champion';
  if (placing === 2) return 'finalist';
  if (placing <= 4) return 't4';
  if (placing <= 8) return 't8';
  if (placing <= 16) return 't16';
  if (placing <= 32) return 't32';
  if (placing <= 64) return 't64';
  if (placing <= 128) return 't128';
  if (placing <= 256) return 't256';
  if (placing <= 512) return 't512';
  if (placing <= 1024) return 't1024';
  return 'no placement';
};

const mapFormat = (format: string | undefined): string | null => {
  if (!format) return null;
  const found = POCKET_FORMATS.find(
    (f) => f.toLowerCase() === format.toLowerCase()
  );
  return found ?? null;
};

const toNoonIsoString = (date: string | undefined): string => {
  const parsed = date ? new Date(date) : new Date();
  const valid = isNaN(parsed.getTime()) ? new Date() : parsed;
  return new Date(
    Date.UTC(valid.getUTCFullYear(), valid.getUTCMonth(), valid.getUTCDate(), 12, 0, 0, 0)
  ).toISOString();
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const parsed = parseLimitlessUrl(body?.url ?? '');

    if (!parsed) {
      return Response.json(
        {
          message:
            'That doesn’t look like a Limitless tournament link. Paste a URL like play.limitlesstcg.com/tournament/<id>/player/<you>.',
          code: 400,
        },
        { status: 400 }
      );
    }

    if (!parsed.playerId) {
      return Response.json(
        {
          message:
            'Please use a player-specific link (it should end with /player/<your-name>) so we know whose results to import.',
          code: 400,
        },
        { status: 400 }
      );
    }

    const { tournamentId, playerId } = parsed;

    let details: LimitlessDetails;
    let standings: LimitlessStanding[];
    let pairings: LimitlessPairing[];

    try {
      [details, standings, pairings] = await Promise.all([
        fetchLimitless(`/tournaments/${tournamentId}/details`),
        fetchLimitless(`/tournaments/${tournamentId}/standings`),
        fetchLimitless(`/tournaments/${tournamentId}/pairings`),
      ]);
    } catch (error: any) {
      if (error?.status === 404) {
        return Response.json(
          { message: 'We couldn’t find that tournament on Limitless.', code: 404 },
          { status: 404 }
        );
      }
      throw error;
    }

    standings = Array.isArray(standings) ? standings : [];
    pairings = Array.isArray(pairings) ? pairings : [];

    const playerKey = playerId.toLowerCase();

    // Build a lookup of player handle -> deck archetype + display info.
    const standingByPlayer = new Map<string, LimitlessStanding>();
    for (const standing of standings) {
      if (standing.player) {
        standingByPlayer.set(standing.player.toLowerCase(), standing);
      }
    }

    const playerStanding = standingByPlayer.get(playerKey);

    const deckIconsFor = (handle: string | null | undefined): string[] => {
      if (!handle) return [];
      const standing = standingByPlayer.get(handle.toLowerCase());
      if (!standing) return [];
      const fromDeck = extractDeckIcons(standing.deck);
      if (fromDeck.length > 0) return fromDeck;
      return extractDeckIcons(standing.decklist);
    };

    // Only the matches this player was actually in, ordered by phase then round.
    const playerPairings = pairings
      .filter(
        (pairing) =>
          pairing.player1?.toLowerCase() === playerKey ||
          pairing.player2?.toLowerCase() === playerKey
      )
      .sort((a, b) => {
        const phaseDiff = (a.phase ?? 0) - (b.phase ?? 0);
        if (phaseDiff !== 0) return phaseDiff;
        return (a.round ?? 0) - (b.round ?? 0);
      });

    let unmatchedDecks = 0;

    const rounds: ImportedRound[] = playerPairings.map((pairing, index) => {
      const isPlayer1 = pairing.player1?.toLowerCase() === playerKey;
      const opponent = isPlayer1 ? pairing.player2 : pairing.player1;
      const winner = (pairing.winner ?? '').toLowerCase();

      // A missing opponent means a bye.
      if (!opponent || opponent.toLowerCase() === 'bye') {
        return {
          round_num: index + 1,
          result: ['W'],
          deck: null,
          match_end_reason: 'Bye',
          turn_orders: [''],
        };
      }

      let result: string[];
      if (!winner || winner === 'tie' || winner === 'draw') {
        result = ['T'];
      } else if (winner === playerKey) {
        result = ['W'];
      } else if (winner === opponent.toLowerCase()) {
        result = ['L'];
      } else {
        result = ['T'];
      }

      const opponentIcons = deckIconsFor(opponent);
      if (opponentIcons.length === 0) unmatchedDecks += 1;

      return {
        round_num: index + 1,
        result,
        deck: deckIconsToArchetype(opponentIcons),
        match_end_reason: null,
        turn_orders: [''],
      };
    });

    if (rounds.length === 0) {
      return Response.json(
        {
          message:
            'We couldn’t find any matches for that player in this tournament. Double-check the player handle in the link.',
          code: 404,
        },
        { status: 404 }
      );
    }

    const response: ImportPocketTournamentResponse = {
      tournament: {
        name: details.name?.trim() || 'Imported tournament',
        date: toNoonIsoString(details.date),
        format: mapFormat(details.format),
        placement: mapPlacement(playerStanding?.placing),
        deck: deckIconsToArchetype(deckIconsFor(playerId)),
      },
      player: {
        id: playerId,
        name: playerStanding?.name?.trim() || playerId,
      },
      rounds,
      unmatchedDecks,
      code: 200,
    };

    return Response.json(response, { status: 200 });
  } catch (error) {
    console.error('Failed to import Limitless tournament:', error);
    return Response.json(
      { message: 'Something went wrong importing from Limitless. Please try again.', code: 500 },
      { status: 500 }
    );
  }
}
