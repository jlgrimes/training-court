import { MatchupRow } from "../Matchups.types";
import { parseISO, format, startOfWeek } from "date-fns";

export type CountStats = {
  wins: number;
  losses: number;
  ties: number;
  total: number;
  winRate: number;
};

export type Streak = {
  type: "W" | "L" | "T" | null;
  length: number;
};

export type TrendPoint = {
  label: string;
  wins: number;
  losses: number;
  ties: number;
  total: number;
  winRate: number;
};

const emptyCount = (): CountStats => ({
  wins: 0,
  losses: 0,
  ties: 0,
  total: 0,
  winRate: 0,
});

const calcWinRate = (wins: number, losses: number, ties: number, total: number) =>
  total === 0 ? 0 : (wins + ties / 3) / total;

export const tallyRows = (rows: MatchupRow[]): CountStats => {
  const counts = rows.reduce(
    (acc, row) => {
      if (row.result === "W") acc.wins++;
      else if (row.result === "L") acc.losses++;
      else acc.ties++;
      acc.total++;
      return acc;
    },
    emptyCount()
  );

  return {
    ...counts,
    winRate: calcWinRate(counts.wins, counts.losses, counts.ties, counts.total),
  };
};

export const getCurrentStreak = (rows: MatchupRow[]): Streak => {
  if (!rows.length) return { type: null, length: 0 };

  const sorted = [...rows].sort(
    (a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()
  );

  const firstResult = sorted[0].result as Streak["type"];
  let length = 0;

  for (const r of sorted) {
    if (r.result === firstResult) {
      length++;
    } else {
      break;
    }
  }

  return { type: firstResult, length };
};

export const lastNStats = (rows: MatchupRow[], n: number): CountStats => {
  const sorted = [...rows].sort(
    (a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()
  );
  return tallyRows(sorted.slice(0, n));
};

export const groupBySourceOrFormat = (
  rows: MatchupRow[],
  key: "source" | "format"
): Record<string, CountStats> => {
  const buckets: Record<string, CountStats> = {};

  rows.forEach((row) => {
    const bucketKey = (row[key] ?? "Unknown") || "Unknown";
    if (!buckets[bucketKey]) buckets[bucketKey] = emptyCount();
    if (row.result === "W") buckets[bucketKey].wins++;
    else if (row.result === "L") buckets[bucketKey].losses++;
    else buckets[bucketKey].ties++;
    buckets[bucketKey].total++;
  });

  Object.keys(buckets).forEach((bucket) => {
    const b = buckets[bucket];
    b.winRate = calcWinRate(b.wins, b.losses, b.ties, b.total);
  });

  return buckets;
};

export const turnOrderSplits = (rows: MatchupRow[]) => {
  const first: CountStats = emptyCount();
  const second: CountStats = emptyCount();
  const unknown: CountStats = emptyCount();

  rows.forEach((row) => {
    const target =
      row.turn_order === "1" ? first : row.turn_order === "2" ? second : unknown;

    if (row.result === "W") target.wins++;
    else if (row.result === "L") target.losses++;
    else target.ties++;
    target.total++;
  });

  [first, second, unknown].forEach((bucket) => {
    bucket.winRate = calcWinRate(bucket.wins, bucket.losses, bucket.ties, bucket.total);
  });

  return { first, second, unknown };
};

export const deckTurnOrderSplits = (rows: MatchupRow[]) => {
  const deckBuckets: Record<
    string,
    { first: CountStats; second: CountStats; total: number }
  > = {};

  rows.forEach((row) => {
    if (!row.deck) return;
    if (!deckBuckets[row.deck]) {
      deckBuckets[row.deck] = {
        first: emptyCount(),
        second: emptyCount(),
        total: 0,
      };
    }
    const bucket = row.turn_order === "1" ? deckBuckets[row.deck].first : row.turn_order === "2" ? deckBuckets[row.deck].second : null;
    if (bucket) {
      if (row.result === "W") bucket.wins++;
      else if (row.result === "L") bucket.losses++;
      else bucket.ties++;
      bucket.total++;
      deckBuckets[row.deck].total++;
    }
  });

  Object.values(deckBuckets).forEach((b) => {
    b.first.winRate = calcWinRate(b.first.wins, b.first.losses, b.first.ties, b.first.total);
    b.second.winRate = calcWinRate(
      b.second.wins,
      b.second.losses,
      b.second.ties,
      b.second.total
    );
  });

  return deckBuckets;
};

export const byOpponentDeck = (rows: MatchupRow[]) => {
  const map: Record<string, { counts: CountStats; lastPlayed: Date | null }> = {};

  rows.forEach((row) => {
    const key = row.opp_deck || "Unknown";
    if (!map[key]) {
      map[key] = { counts: emptyCount(), lastPlayed: null };
    }

    if (row.result === "W") map[key].counts.wins++;
    else if (row.result === "L") map[key].counts.losses++;
    else map[key].counts.ties++;
    map[key].counts.total++;
    const dt = parseISO(row.date);
    if (!map[key].lastPlayed || dt > map[key].lastPlayed) map[key].lastPlayed = dt;
  });

  Object.values(map).forEach((entry) => {
    const c = entry.counts;
    c.winRate = calcWinRate(c.wins, c.losses, c.ties, c.total);
  });

  return map;
};

export const freebiesBreakdown = (rows: MatchupRow[]) => {
  const reasons: Record<string, number> = {};
  rows.forEach((row) => {
    if (row.match_end_reason) {
      reasons[row.match_end_reason] = (reasons[row.match_end_reason] ?? 0) + 1;
    }
  });
  return reasons;
};

export const weeklyTrend = (rows: MatchupRow[]): TrendPoint[] => {
  const buckets: Record<string, CountStats> = {};

  rows.forEach((row) => {
    const week = format(startOfWeek(parseISO(row.date), { weekStartsOn: 1 }), "yyyy-MM-dd");
    if (!buckets[week]) buckets[week] = emptyCount();
    const target = buckets[week];
    if (row.result === "W") target.wins++;
    else if (row.result === "L") target.losses++;
    else target.ties++;
    target.total++;
  });

  return Object.entries(buckets)
    .map(([label, counts]) => ({
      label,
      ...counts,
      winRate: calcWinRate(counts.wins, counts.losses, counts.ties, counts.total),
    }))
    .sort((a, b) => (a.label > b.label ? 1 : -1));
};

export const formatWinRate = (wr: number) => `${Math.round(wr * 100)}%`;
