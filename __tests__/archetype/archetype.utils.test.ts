import { determineArchetype } from "@/components/archetype/utils/archetype.utils";

describe('archetype utils', () => {
  it('should determine archetype from playing a Pokemon', () => {
    const mockLog = [
      `comp0cker played Regidrago VSTAR onto his bench`,
    ];
    expect(determineArchetype(mockLog, 'comp0cker', 'en')).toEqual('regidrago');
  });

  it('should correctly determine archetype in German', () => {
    const mockLog = [
      `comp0cker hat Ur-Palkia-V auf der Bank zu Ur-Palkia-VSTAR entwickelt.`,
    ];
    expect(determineArchetype(mockLog, 'comp0cker', 'de')).toEqual('palkia-origin');
  });

  it('should correctly determine archetype from evolving', () => {
    const mockLog = [
      `- comp0cker evolved into Regidrago VSTAR`,
    ];
    expect(determineArchetype(mockLog, 'comp0cker', 'en')).toEqual('regidrago');
  })

  // Synthetic log lines for the newly listed archetypes
  it.each([
    ['comp0cker played Slowking to the Bench.', 'slowking'],
    ['comp0cker evolved Kadabra to Alakazam on the Bench.', 'alakazam'],
    ['comp0cker played Dhelmise to the Bench.', 'dhelmise'],
    ['comp0cker evolved Buneary to Mega Lopunny ex on the Bench.', 'lopunny-mega'],
    ['comp0cker evolved Dwebble to Crustle on the Bench.', 'crustle'],
    ['comp0cker evolved Drilbur to Mega Excadrill ex on the Bench.', 'excadrill-mega'],
    ['comp0cker evolved Riolu to Mega Lucario ex on the Bench.', 'lucario-mega'],
    ["comp0cker evolved Team Rocket's Murkrow to Team Rocket's Honchkrow on the Bench.", 'honchkrow'],
    ['comp0cker evolved Carvanha to Mega Sharpedo ex on the Bench.', 'sharpedo-mega'],
    ["comp0cker evolved Cynthia's Gabite to Cynthia's Garchomp ex on the Bench.", 'garchomp'],
    ['comp0cker evolved Bayleef to Meganium on the Bench.', 'meganium'],
    ["comp0cker played Team Rocket's Mewtwo ex to the Bench.", 'mewtwo'],
    ['comp0cker evolved Frogadier to Greninja ex on the Bench.', 'greninja'],
    ["comp0cker evolved Hop's Phantump to Hop's Trevenant on the Bench.", 'trevenant'],
    ['comp0cker evolved Staryu to Mega Starmie ex on the Bench.', 'starmie-mega'],
    ["comp0cker played Lillie's Clefairy ex to the Bench.", 'clefairy'],
    ['comp0cker played Mega Absol ex to the Bench.', 'absol-mega'],
  ])('detects new archetype: %s', (line, expected) => {
    expect(determineArchetype([line], 'comp0cker', 'en')).toEqual(expected);
  });

  it('keeps existing priority: regigigas still beats regidrago', () => {
    const mockLog = [
      'comp0cker played Regidrago V to the Bench.',
      'comp0cker played Regigigas V to the Bench.',
    ];
    expect(determineArchetype(mockLog, 'comp0cker', 'en')).toEqual('regigigas');
  });

  it('Radiant Greninja alone does not count as a Greninja deck', () => {
    expect(determineArchetype(['comp0cker played Radiant Greninja to the Bench.'], 'comp0cker', 'en')).toBeUndefined();
  });
});
