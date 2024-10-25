import { isAfter, isBefore } from "date-fns";
import { PokemonSet } from "./_types";

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