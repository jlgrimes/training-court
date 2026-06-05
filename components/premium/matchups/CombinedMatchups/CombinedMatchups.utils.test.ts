import { getMatchupWinRate } from "../Matchups.utils";
import { MatchupRow } from "../Matchups.types";
import { convertRpcRetToMatchups } from "./CombinedMatchups.utils";

const buildTournamentRow = (
  overrides: Partial<MatchupRow>
): MatchupRow => ({
  source: "Tournament Rounds",
  deck: "Gardevoir ex",
  decklist_id: null,
  opp_deck: "Charizard ex",
  result: "L",
  match_end_reason: "",
  turn_order: "1",
  date: "2026-01-01",
  format: "Standard",
  ...overrides,
});

describe("convertRpcRetToMatchups", () => {
  it("excludes immediate match ends from matchup totals and win rate", () => {
    const matchups = convertRpcRetToMatchups([
      buildTournamentRow({
        result: "W",
        match_end_reason: "",
        date: "2026-01-01",
      }),
      buildTournamentRow({
        result: "L",
        match_end_reason: "",
        turn_order: "2",
        date: "2026-01-02",
      }),
      buildTournamentRow({
        result: "T",
        match_end_reason: "",
        turn_order: "",
        date: "2026-01-03",
      }),
      buildTournamentRow({
        result: "T",
        match_end_reason: "ID",
        turn_order: "",
        date: "2026-01-04",
      }),
      buildTournamentRow({
        result: "W",
        match_end_reason: "Bye",
        turn_order: "",
        date: "2026-01-05",
      }),
      buildTournamentRow({
        result: "W",
        match_end_reason: "No show",
        turn_order: "",
        date: "2026-01-06",
      }),
    ]);

    const result = matchups["Gardevoir ex"]["Charizard ex"];

    expect(result.total).toEqual([1, 1, 1]);
    expect(result.goingFirst).toEqual([1, 0, 0]);
    expect(result.goingSecond).toEqual([0, 1, 0]);
    expect(getMatchupWinRate(result.total)).toBeCloseTo(4 / 9);
  });
});
