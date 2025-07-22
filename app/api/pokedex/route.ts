import { load } from "cheerio";
import { withRateLimit, withErrorHandler } from "@/lib/api/middleware";
import { NextRequest } from "next/server";

const axios = require("axios");

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    return withRateLimit(
      { max: 30, windowMs: 60 * 1000 }, // 30 requests per minute
      async () => {
        const response = await axios.get('https://limitlesstcg.com/cards/pokedex');
        const $ = load(response.data);
        const pokemon = $('body .pokedex > tbody > tr[data-pokedex] img');
        const pokedex: string[] = [];

        $(pokemon).each((i, el) => {
          const src = $(el).attr('src');
          if (src) pokedex.push(src);
        });

        return Response.json({ pokedex, code: 200 })
      }
    )(request);
  });
}