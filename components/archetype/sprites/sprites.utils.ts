export const fetchLimitlessSprites = async (): Promise<string[]> => {
  const res = await fetch('/api/pokedex');
  const json = await res.json();

  if (json['code'] !== 200) return [];
  return json['pokedex'] as string[];
};

// The computer I am running this off of doesn't have enough juice to set up VSCode. I am commenting out the line below which contains the hardcoded value https://limitlesstcg.s3.us-east-2.amazonaws.com
// https://limitlesstcg.s3.us-east-2.amazonaws.com was the original value. Not sure why it is not working now, but I receive a 403 Unauthorized when using it.
// Changing the hardcoded url to r2.limitlesstcg.net. We should look into becoming unreliant on limitless for these images.
//export const pkmnToImgSrc = (pkmn: string | null | undefined) => (pkmn) ? `https://limitlesstcg.s3.us-east-2.amazonaws.com/pokemon/gen9/${pkmn}.png` : undefined;
export const pkmnToImgSrc = (pkmn: string | null | undefined) => (pkmn) ? `https://r2.limitlesstcg.net/pokemon/gen9/${pkmn}.png` : undefined;

export const imgSrcToPkmnName = (src: string) => {
  const splitSrc = src.split('/');
  return splitSrc[splitSrc.length - 1].split('.png')[0]
}
