import { selector } from "recoil";
import { MatchupResult, MatchupRow, Matchups } from "../Matchups.types";
import { flattenMatchupsToDeckSummary, getTotalDeckMatchupResult } from "../Matchups.utils";
import {
	decklistFilterAtom,
	formatFilterAtom,
	rawMatchupsAtom,
	sourceFilterAtom,
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
		const decklistId = get(decklistFilterAtom);

		if (!rows) return null;
		if (sources.length === 0) return [];

		return rows.filter((r) => {
			// source filter
			if (!sources.includes(r.source)) return false;

			// format filter
			if (!(fmt === null || fmt === "All" || r.format === fmt)) return false;

			// exact saved-decklist filter.
			if (decklistId && r.decklist_id !== decklistId) return false;

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
