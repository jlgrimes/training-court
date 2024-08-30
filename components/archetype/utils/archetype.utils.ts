const pokemonToFind = [
  'regidrago',
  'gholdengo',
  'roaring moon',
  'raging bolt',
  'lugia',
  'chien-pao',
  'gardevoir',
  'dragapult',
  'iron thorns',
  'comfey',
  'charizard',
  'entei',
  'palkia'
];

// Pokemon that might not indicate exactly the archetype we can use to infer the archetype
const associatedPokemon = [{
  association: 'charmander',
  deck: 'charizard'
}, {
  association: 'frigibax',
  deck: 'chien-pao'
}]

export const determineArchetype = (log: string[], playerName: string): string | undefined => {
  const drawnCardsLines = log.filter((line, idx) => {
    if (line.includes(`${playerName} played `) || line.includes(`${playerName} evolved `)) {
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