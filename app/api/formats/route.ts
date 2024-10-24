import { parseISO, nextFriday, add, isBefore, isAfter } from "date-fns";
import { PokemonTCGApiPokemonSet } from "./_types";
import { getRotationBlocks } from "./_utils";

export async function GET() {
  try {
    const response = await fetch('https://api.pokemontcg.io/v2/sets');
    const data: Record<string, PokemonTCGApiPokemonSet[]> = await response.json();
    const dataWithLegalities = data['data'].map((obj) => {
      const releaseDate = parseISO(obj['releaseDate'].replaceAll('/', ''));
      const legalityDate = add(nextFriday(releaseDate), {
        weeks: 1
      });

      return ({
        ...obj,
        releaseDate: releaseDate.toString(),
        legalityDate: legalityDate.toString()
      })
    })
    
    const alteredData = dataWithLegalities.sort((a, b) => {
      if (isBefore(a.releaseDate, b.releaseDate)) return 1;
      if (isAfter(a.releaseDate, b.releaseDate)) return -1;

      if (a.name.length < b.name.length) return -1;
      if (a.name.length > b.name.length) return 1;

      return 0;
    }).filter((set, idx) => dataWithLegalities.findIndex(({ legalityDate }) => legalityDate === set.legalityDate) === idx && !['sve'].includes(set.id) && !set.name.includes(' Promos') && set.series !== 'Other');

    const blocks = getRotationBlocks(alteredData)

    return Response.json({ data: blocks, code: 200 })
  } catch (error) {
    console.error(error);

    return Response.json({ message: 'Error scraping', code: 500 })
  }
}