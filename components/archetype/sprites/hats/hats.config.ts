export type HatType = 'santa';

export interface HatOverlay {
  src: string;
  /** px offset from top-left of sprite */
  offsetX: number;
  offsetY: number;
  /** scale multiplier relative to sprite size */
  scale: number;
  /** optional per-sprite overrides keyed by normalized name (lowercase) */
  perPokemon?: Record<string, Partial<Omit<HatOverlay, 'perPokemon'>>>;
}

export const hatOverlays: Record<HatType, HatOverlay> = {
  santa: {
    src: '/hats/santa.png',
    offsetX: 5,
    offsetY: -12,
    scale: 0.85,
    perPokemon: {
      // tweak positions for specific sprites
      gardevoir: { offsetX: 5, offsetY: -12, scale: 0.9 },
      charizard: { offsetX: -4, offsetY: -7, scale: 0.85 },
      pidgeot: { offsetX: -2, offsetY: -8, scale: 0.75 },
      ceruledge: { offsetX: 8, offsetY: -6, scale: 0.75 },
      cramorant: { offsetX: 9, offsetY: -16, scale: 0.75 },
      'zacian-crowned': { offsetX: 3, offsetY: 2, scale: 0.7 },
      jellicent: { offsetX: 11, offsetY: -8, scale: 0.7 },
      'absol-mega': { offsetX: 1, offsetY: 1, scale: 0.6 },
      dusknoir: { offsetX: 13, offsetY: -8, scale: 0.5 },
      'lopunny-mega': { offsetX: 7, offsetY: -12, scale: 0.7 },
      noctowl: { offsetX: 7, offsetY: -6, scale: 0.7 },
      alakazam: { offsetX: 9, offsetY: -5, scale: 0.7 },
      dudunsparce: { offsetX: 3, offsetY: 2, scale: 0.7 },
      zoroark: { offsetX: 1, offsetY: -8, scale: 0.85 },
      joltik: { offsetX: 10, offsetY: 3, scale: 0.5 },
      flareon: { offsetX: 1, offsetY: 2, scale: 0.7 },
      'venusaur-mega': { offsetX: 3, offsetY: 2, scale: 0.7 },
      'lucario-mega': { offsetX: 14, offsetY: -6, scale: 0.55 },
      crustle: { offsetX: 12, offsetY: -11, scale: 0.7 },
    },
  },
  // baseballcap: {
  //   src: '/hats/baseball-cap.png',
  //   offsetX: -4,
  //   offsetY: -8,
  //   scale: 0.85,
  //   perPokemon: {
  //     // tweak positions for specific sprites
  //     gardevoir: { offsetX: 5, offsetY: -12, scale: 0.9 },
  //     charizard: { offsetX: -4, offsetY: -7, scale: 0.85 },
  //     pidgeot: { offsetX: -2, offsetY: -8, scale: 0.75 },
  //     ceruledge: { offsetX: 8, offsetY: -6, scale: 0.75 },
  //     cramorant: { offsetX: 9, offsetY: -16, scale: 0.75 },
  //     'zacian-crowned': { offsetX: 3, offsetY: 2, scale: 0.7 },
  //   },
  // },
};
