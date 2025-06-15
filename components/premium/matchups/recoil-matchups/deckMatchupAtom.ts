import { atom } from "recoil";
import { DeckMatchup } from "../Matchups.types";

export const deckMatchupsAtom = atom<Record<string, DeckMatchup> | null>({
  key: 'deckMatchupsAtom',
  default: null,
});
