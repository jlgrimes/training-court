const pokemonToFind = [
  'regidrago',
  'raging bolt',
  'lugia',
  'chien-pao',
  'gardevoir',
  'dragapult',
  'iron thorns',
  'comfey',
  'charizard',
  'entei'
];

export const determineArchetype = (log: string[], playerName: string): string | undefined => {
  const drawnCardsLines = log.filter((line, idx) => {
    if (idx > 1 && (log[idx - 1].includes(`${playerName} drew `) || (log[idx - 2].includes(`${playerName} drew `) && log[idx - 1].includes(`drawn cards.`)))) {
      return true;
    }

    return false;
  });

  const archetype = pokemonToFind.find((targetMon) => drawnCardsLines.some((drawnCards) => drawnCards.toLowerCase().includes(targetMon.toLowerCase())));
  return archetype?.replace(' ', '-');
}