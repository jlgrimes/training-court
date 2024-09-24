import { load } from "cheerio";

const axios = require("axios");

export async function GET() {
  try {
    const response = await axios.get('https://limitlesstcg.com/cards/pokedex');
    const $ = load(response.data);
    const pokemon = $('body .pokedex > tbody > tr[data-pokedex] img');
    const pokedex: string[] = [];

    $(pokemon).each((i, el) => {
      const src = $(el).attr('src');
      if (src) pokedex.push(src);
    });

    return Response.json({ pokedex, code: 200 })
  } catch (error) {
    console.error(error);

    return Response.json({ message: 'Error scraping', code: 500 })
  }
}