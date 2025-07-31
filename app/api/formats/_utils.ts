import { isAfter, isBefore, parseISO, nextFriday, add } from "date-fns";
import { PokemonSet, PokemonTCGApiPokemonSet } from "./_types";

const rotations = [
  new Date('2024-04-05'),
  new Date('2023-04-13'),
  new Date('2021-09-10'),
  new Date('2020-04-27'),
];

export const getRotationBlocks = (sets: PokemonSet[]) => {
  const setsInRotations = sets.filter((set) => isAfter(set.legalityDate, new Date('2020-04-27')));
  const rotationStartingSets = rotations.map((startingDate: Date) => {
    const setRightBeforeRotationIdx = sets.findIndex((set) => isBefore(set.legalityDate, startingDate));
    return sets[setRightBeforeRotationIdx - 1];
  });

  return setsInRotations.map((set) => {
    const startingSetIdx = rotations.findIndex((rotationDate) => isBefore(rotationDate, set.legalityDate)) + 1;
    if (startingSetIdx >= rotations.length) return null;
    
    return {
      format: `${rotationStartingSets[startingSetIdx].ptcgoCode}-${set.ptcgoCode}`,
      releaseDate: set.releaseDate,
      legalityDate: set.legalityDate,
    }
  }).filter((set) => set);
}

export const getProcessedPokemonSets = async (): Promise<PokemonSet[]> => {
  const response = await fetch('https://api.pokemontcg.io/v2/sets');
  const data: Record<string, PokemonTCGApiPokemonSet[]> = await response.json();
  
  const dataWithLegalities = data['data'].map((obj) => {
    const releaseDate = parseISO(obj['releaseDate'].replaceAll('/', ''));
    const legalityDate = add(nextFriday(releaseDate), {
      weeks: 1
    });

    return ({
      ...obj,
      releaseDate: releaseDate.toISOString(),
      legalityDate: legalityDate.toISOString()
    })
  })
  
  const alteredData = dataWithLegalities.sort((a, b) => {
    if (isBefore(a.releaseDate, b.releaseDate)) return 1;
    if (isAfter(a.releaseDate, b.releaseDate)) return -1;

    if (a.name.length < b.name.length) return -1;
    if (a.name.length > b.name.length) return 1;

    return 0;
  }).filter((set, idx) => dataWithLegalities.findIndex(({ legalityDate }) => legalityDate === set.legalityDate) === idx && !['sve'].includes(set.id) && !set.name.includes(' Promos') && set.series !== 'Other');

  return alteredData;
}