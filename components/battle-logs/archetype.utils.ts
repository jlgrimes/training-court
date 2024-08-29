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
    if (line.includes(`${playerName} played `) || line.includes(`${playerName} evolved `)) {
      return true;
    }

    return false;
  });
  const archetype = pokemonToFind.find((targetMon) => drawnCardsLines.some((drawnCards) => drawnCards.toLowerCase().includes(targetMon.toLowerCase())));
  return archetype?.replace(' ', '-');
}