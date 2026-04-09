import { Database } from "@/database.types";
import { nextRoundNumber, normalizeTournamentRounds, upsertRound } from "./tournament-rounds.utils";

type TournamentRound = Database['public']['Tables']['tournament rounds']['Row'];

const buildRound = (overrides: Partial<TournamentRound>): TournamentRound => ({
  created_at: "2026-01-01T00:00:00.000Z",
  deck: null,
  id: "round-id",
  match_end_reason: null,
  result: ["W"],
  round_num: 1,
  tournament: "t-1",
  turn_orders: null,
  user: "u-1",
  ...overrides,
});

describe("tournament-rounds.utils", () => {
  describe("normalizeTournamentRounds", () => {
    it("dedupes by tournament+round_num and keeps the latest seen value", () => {
      const rounds = [
        buildRound({ id: "a-1", tournament: "t-1", round_num: 1, deck: "first" }),
        buildRound({ id: "a-2", tournament: "t-1", round_num: 2, deck: "second" }),
        buildRound({ id: "a-3", tournament: "t-1", round_num: 1, deck: "replacement" }),
      ];

      expect(normalizeTournamentRounds(rounds)).toEqual([
        buildRound({ id: "a-3", tournament: "t-1", round_num: 1, deck: "replacement" }),
        buildRound({ id: "a-2", tournament: "t-1", round_num: 2, deck: "second" }),
      ]);
    });

    it("sorts rounds by round_num ascending", () => {
      const rounds = [
        buildRound({ id: "a-3", round_num: 3 }),
        buildRound({ id: "a-1", round_num: 1 }),
        buildRound({ id: "a-2", round_num: 2 }),
      ];

      expect(normalizeTournamentRounds(rounds).map((round) => round.round_num)).toEqual([1, 2, 3]);
    });

    it("does not dedupe rounds across different tournaments", () => {
      const rounds = [
        buildRound({ id: "t1-r1", tournament: "t-1", round_num: 1 }),
        buildRound({ id: "t2-r1", tournament: "t-2", round_num: 1 }),
      ];

      expect(normalizeTournamentRounds(rounds)).toEqual(rounds);
    });
  });

  describe("nextRoundNumber", () => {
    it("returns 1 when no rounds exist", () => {
      expect(nextRoundNumber([])).toBe(1);
    });

    it("returns max(round_num)+1 and ignores array length or gaps", () => {
      const rounds = [
        buildRound({ id: "a-1", round_num: 1 }),
        buildRound({ id: "a-2", round_num: 4 }),
        buildRound({ id: "a-3", round_num: 2 }),
      ];

      expect(nextRoundNumber(rounds)).toBe(5);
    });
  });

  describe("upsertRound", () => {
    it("updates by id for round edits", () => {
      const existing = buildRound({ id: "r-1", round_num: 3, deck: "before" });
      const updated = buildRound({ id: "r-1", round_num: 3, deck: "after" });
      const rounds = [buildRound({ id: "r-0", round_num: 1 }), existing];

      expect(upsertRound(rounds, updated)).toEqual([
        buildRound({ id: "r-0", round_num: 1 }),
        updated,
      ]);
    });

    it("replaces existing tournament+round_num when inserting a duplicate round number", () => {
      const rounds = [
        buildRound({ id: "r-1", tournament: "t-1", round_num: 1, deck: "old" }),
      ];
      const inserted = buildRound({ id: "r-2", tournament: "t-1", round_num: 1, deck: "new" });

      expect(upsertRound(rounds, inserted)).toEqual([inserted]);
    });
  });
});
