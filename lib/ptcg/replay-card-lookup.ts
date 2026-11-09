import type { DeckbuilderCardMetadata } from '@/lib/server/ptcg-card-catalog';

// Live's expansion ids differ from several codes in the upstream catalog.
// Use the printed set abbreviation to disambiguate collisions (e.g. sv9).
const liveSetIds: Record<string, string> = {
  SVI: 'sv1', PAL: 'sv2', OBF: 'sv3', MEW: 'sv3-5', PAR: 'sv4',
  PAF: 'sv4-5', TEF: 'sv5', TWM: 'sv6', SFA: 'sv6-5', SCR: 'sv7',
  SSP: 'sv8', PRE: 'sv8-5', JTG: 'sv9', DRI: 'sv10',
};

export function replayCatalogSetIds(metadata: DeckbuilderCardMetadata): string[] {
  const abbreviation = metadata.setCode?.toUpperCase();
  const liveId = abbreviation ? liveSetIds[abbreviation] : undefined;
  return [liveId ?? metadata.setId, metadata.setCode].filter((value): value is string => !!value)
    .map((value) => value.toLowerCase());
}
