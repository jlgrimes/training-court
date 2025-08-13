'use client';

import { atom } from 'recoil';

export interface PocketDeck {
  id: string;
  name: string;
  cards: PocketCard[];
  format: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PocketCard {
  id: string;
  name: string;
  type: string;
  rarity: string;
  count: number;
  imageUrl?: string;
}

export interface PocketCollection {
  id: string;
  userId: string;
  cards: PocketCard[];
  totalCards: number;
  uniqueCards: number;
  lastUpdated?: string;
}

export const pocketDecksAtom = atom<PocketDeck[]>({
  key: 'pocketDecksState',
  default: [],
});

export const pocketCollectionAtom = atom<PocketCollection | null>({
  key: 'pocketCollectionState',
  default: null,
});

export const selectedPocketDeckAtom = atom<PocketDeck | null>({
  key: 'selectedPocketDeckState',
  default: null,
});

export const pocketLoadingAtom = atom<boolean>({
  key: 'pocketLoadingState',
  default: false,
});