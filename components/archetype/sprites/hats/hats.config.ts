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
    offsetX: -4,
    offsetY: -8,
    scale: 0.85,
    perPokemon: {
      // tweak positions for specific sprites
      gardevoir: { offsetX: 5, offsetY: -12, scale: 0.9 },
      charizard: { offsetX: -4, offsetY: -7, scale: 0.85 },
      pidgeot: { offsetX: -2, offsetY: -8, scale: 0.75 },
      ceruledge: { offsetX: 8, offsetY: -6, scale: 0.75 },
      cramorant: { offsetX: 9, offsetY: -16, scale: 0.75 },
      'zacian-crowned': { offsetX: 3, offsetY: 2, scale: 0.7 },
    },
  },
};
