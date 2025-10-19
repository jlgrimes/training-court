import { selector } from "recoil";
import { MatchupResult, MatchupRow, Matchups } from "../Matchups.types";
import { flattenMatchupsToDeckSummary, getTotalDeckMatchupResult } from "../Matchups.utils";
import {
	formatFilterAtom,
	rawMatchupsAtom,
	sourceFilterAtom,
	turnOrderFilterAtom,
} from "./deckMatchupAtom";
import { convertRpcRetToMatchups } from "../CombinedMatchups/CombinedMatchups.utils";

// export const deckMatchupsSelector = selector<[string, MatchupResult][]>({
//   key: 'deckMatchupsSelector',
//   get: ({ get }) => {
//     const matchups = get(deckMatchupsAtom);
//     if (!matchups) return [];

//     return Object.entries(matchups).map(([deck, deckMatchup]) => {
//       const result: [string, MatchupResult] = [
//         deck,
//         getTotalDeckMatchupResult(deckMatchup),
//       ];
//       return result;
//     });
//   },
// });

/** Rows filtered by source + format (cheap) */
export const filteredRowsSelector = selector<MatchupRow[] | null>({
	key: "filteredRowsSelector",
	get: ({ get }) => {
		const rows = get(rawMatchupsAtom);
		const sources = get(sourceFilterAtom);
		const fmt = get(formatFilterAtom);
		const selectedStartingTurn = get(turnOrderFilterAtom);

		if (!rows) return null;
		if (sources.length === 0) return [];

		const filterByTurn = !(selectedStartingTurn.length === 0 || selectedStartingTurn.length === 2);

		return rows.filter((r) => {
		// source
		if (!sources.includes(r.source)) return false;

		// format
		if (!(fmt === null || fmt === "All" || r.format === fmt)) return false;

		// turn order
		const to = Number(r.turn_order);
		const isValid = to === 1 || to === 2;
		if (!isValid) return false;

		// apply turn filter only when exactly one is selected
		if (filterByTurn && !selectedStartingTurn.includes(String(to))) return false;

		return true;
		});
	},
});

/** Deck -> matchup data (heavier) */
export const transformedMatchupsSelector = selector<Matchups | null>({
	key: "transformedMatchupsSelector",
	get: ({ get }) => {
		const filtered = get(filteredRowsSelector);
		if (!filtered) return null;
		return convertRpcRetToMatchups(filtered);
	},
});

/** Flattened summaries for the table */
export const deckSummariesSelector = selector({
	key: "deckSummariesSelector",
	get: ({ get }) => {
		const transformed = get(transformedMatchupsSelector);
		if (!transformed) return [];
		return flattenMatchupsToDeckSummary(transformed);
	},
});
