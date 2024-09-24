export const fetchLimitlessSprites = async (): Promise<string[]> => {
  const res = await fetch('/api/pokedex');
  const json = await res.json();

  if (json['code'] !== 200) return [];
  return json['pokedex'] as string[];
};

export const pkmnToImgSrc = (pkmn: string | null | undefined) => (pkmn) ? `https://limitlesstcg.s3.us-east-2.amazonaws.com/pokemon/gen9/${pkmn}.png` : undefined;
export const imgSrcToPkmnName = (src: string) => {
  const splitSrc = src.split('/');
  return splitSrc[splitSrc.length - 1].split('.png')[0]
}