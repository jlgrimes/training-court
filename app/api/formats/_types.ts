export interface PokemonTCGApiPokemonSet {
  "id": string,
  "name": string,
  "series": string,
  "printedTotal": number,
  "total": number,
  "legalities": Record<string, string>,
  "ptcgoCode": string,
  "releaseDate": string,
  "updatedAt": string,
  "images": Record<string, string>,
}

export interface PokemonSet extends PokemonTCGApiPokemonSet {
  "legalityDate": string
}