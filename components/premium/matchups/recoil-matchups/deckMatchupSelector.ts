import { selector } from "recoil";
import { MatchupResult } from "../Matchups.types";
import { deckMatchupsAtom } from "./deckMatchupAtom";
import { getTotalDeckMatchupResult } from "../Matchups.utils";

export const deckMatchupsSelector = selector<[string, MatchupResult][]>({
  key: 'deckMatchupsSelector',
  get: ({ get }) => {
    const matchups = get(deckMatchupsAtom);
    if (!matchups) return [];

    return Object.entries(matchups).map(([deck, deckMatchup]) => {
      const result: [string, MatchupResult] = [
        deck,
        getTotalDeckMatchupResult(deckMatchup),
      ];
      return result;
    });
  },
});
