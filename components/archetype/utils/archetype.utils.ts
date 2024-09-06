const pokemonToFind = [
  // tier one as of 2024
  'regidrago',
  'miraidon',
  'snorlax',
  'roaring moon',
  'raging bolt',
  'lugia',
  'chien-pao',
  'gardevoir',
  'dragapult',
  'iron thorns',
  'charizard',

  // tier two and below
  'dialga',
  'palkia',
  'giratina',
  'arceus',
  'gholdengo',
  'comfey',
  'entei',
  'great tusk',

  // secondary/rogue
  'ogerpon',
  'conkeldurr',
  'pidgeot'
];

// Pokemon that might not indicate exactly the archetype we can use to infer the archetype
const associatedPokemon = [{
  association: 'charmander',
  deck: 'charizard'
}, {
  association: 'frigibax',
  deck: 'chien-pao'
}, {
  association: 'ralts',
  deck: 'gardevoir'
}]

export const determineArchetype = (log: string[], playerName: string): string | undefined => {
  const drawnCardsLines = log.filter((line, idx) => {
    if (line.includes(`${playerName} played `) || line.includes(`${playerName} evolved `) || (line.includes(`${playerName}'s `) && line.includes(`was Knocked Out`))) {
      return true;
    }

    return false;
  });
  let archetype = pokemonToFind.find((targetMon) => drawnCardsLines.some((drawnCards) => drawnCards.toLowerCase().includes(targetMon.toLowerCase())));

  if (!archetype) {
    archetype = associatedPokemon.find((targetMon) => drawnCardsLines.some((drawnCards) => drawnCards.toLowerCase().includes(targetMon.association.toLowerCase())))?.deck;
  }

  return archetype?.replace(' ', '-');
}