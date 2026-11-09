import type { DeckbuilderCatalogCard } from './ptcg-card-catalog';

// Exact MEE 001–008 artwork, including sets missing from the upstream catalog.
// Source: https://images.pokedata.ovh/en/mee/{number}_hires.webp
const meeBasicEnergyCards = ['Grass', 'Fire', 'Water', 'Lightning', 'Psychic', 'Fighting', 'Darkness', 'Metal']
  .map((type, index): DeckbuilderCatalogCard => {
    const number = String(index + 1);
    const image = `/images/replay/mee-${number.padStart(3, '0')}.webp`;
    return {
      id: `mee_${number}`, localId: number, name: `Basic ${type} Energy`, category: 'Energy', imageUrl: image, imageUrlHiRes: image,
      metadata: { setId: 'mee', setCode: 'MEE', number, energyKind: 'Basic', cardText: [], weakness: [], resistance: [], retreatCost: [], rulebox: [] },
    };
  });

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
}, ...meeBasicEnergyCards];

