import type { DeckbuilderCatalogCard } from './ptcg-card-catalog';

// This printing is absent from the upstream catalog.
// Artwork: https://limitlesstcg.com/cards/en/SVE/21
export const supplementalReplayCards: DeckbuilderCatalogCard[] = [{
  id: 'sve_21', localId: '21', name: 'Basic Psychic Energy', category: 'Energy',
  imageUrl: '/images/replay/sve-021.png', imageUrlHiRes: '/images/replay/sve-021.png',
  metadata: {
    setId: 'sve', setCode: 'SVE', setName: 'Scarlet & Violet Energy', number: '21',
    energyKind: 'Basic', cardText: [], weakness: [], resistance: [], retreatCost: [], rulebox: [],
  },
}, {
  // Live's alternate-art identifier; the physical card is SVE 005.
  // Artwork: https://images.pokedata.ovh/en/svalt/116_hires.webp
  id: 'svalt_116', localId: '116', name: 'Basic Psychic Energy', category: 'Energy',
  imageUrl: '/images/replay/svalt-116.webp', imageUrlHiRes: '/images/replay/svalt-116.webp',
  metadata: {
    setId: 'svalt', number: '116', energyKind: 'Basic',
    cardText: [], weakness: [], resistance: [], retreatCost: [], rulebox: [],
  },
}, {
  // Artwork: https://images.pokedata.ovh/en/mee/4_hires.webp
  id: 'mee_4', localId: '4', name: 'Basic Lightning Energy', category: 'Energy',
  imageUrl: '/images/replay/mee-004.webp', imageUrlHiRes: '/images/replay/mee-004.webp',
  metadata: {
    setId: 'mee', setCode: 'MEE', number: '4', energyKind: 'Basic',
    cardText: [], weakness: [], resistance: [], retreatCost: [], rulebox: [],
  },
}];

