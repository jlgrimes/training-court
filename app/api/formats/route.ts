import { parseISO, nextFriday, add } from "date-fns";
import { PokemonTCGApiPokemonSet } from "./_types";

export async function GET() {
  try {
    const response = await fetch('https://api.pokemontcg.io/v2/sets');
    const data: Record<string, PokemonTCGApiPokemonSet[]> = await response.json();
    const alteredData = data['data'].map((obj) => {
      const releaseDate = parseISO(obj['releaseDate'].replaceAll('/', ''));
      const legalityDate = add(nextFriday(releaseDate), {
        weeks: 1
      });

      return ({
        ...obj,
        releaseDate,
        legalityDate
      })
    })

    return Response.json({ data: alteredData, code: 200 })
  } catch (error) {
    console.error(error);

    return Response.json({ message: 'Error scraping', code: 500 })
  }
}