import { atom } from "recoil";
import { MatchupResult, MatchupRow } from "../Matchups.types";

// export const deckMatchupsAtom = atom<Record<string, DeckMatchup> | null>({
//   key: 'deckMatchupsAtom',
//   default: null,
// });

export const rawMatchupsAtom = atom<MatchupRow[] | null>({
	key: "rawMatchupsAtom",
	default: null,
});

export const sourceFilterAtom = atom<string[]>({
	key: "sourceFilterAtom",
	default: ["Battle Logs", "Tournament Rounds"],
});

export const formatFilterAtom = atom<string | null>({
	key: "formatFilterAtom",
	default: "All",
});

// turn_order field represents 1 (first) and 2 (second).
// Both are selected representing all games.
export const turnOrderFilterAtom = atom<string[]>({
  key: "turnOrderFilter",
  default: ["1", "2"],
});


export const detailDeckAtom = atom<string | undefined>({
	key: "detailDeckAtom",
	default: undefined,
});
