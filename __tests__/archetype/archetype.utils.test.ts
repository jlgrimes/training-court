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
    ['comp0cker evolved Slowpoke to Slowking on the Bench.', 'slowking'],
    ["comp0cker played N's Zoroark ex to the Bench.", 'zoroark'],
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
    ["comp0cker evolved Marnie's Morgrem to Marnie's Grimmsnarl ex on the Bench.", 'grimmsnarl'],
    ["comp0cker played Team Rocket's Mewtwo ex to the Bench.", 'mewtwo'],
    ['comp0cker evolved Frogadier to Mega Greninja ex on the Bench.', 'greninja-mega'],
    ['comp0cker evolved Frogadier to Greninja ex on the Bench.', 'greninja'],
    ["comp0cker evolved Hop's Phantump to Hop's Trevenant on the Bench.", 'trevenant'],
    ['comp0cker evolved Staryu to Mega Starmie ex on the Bench.', 'starmie-mega'],
    ["comp0cker played Lillie's Clefairy ex to the Bench.", 'clefairy'],
    ['comp0cker played Mega Absol ex to the Bench.', 'absol-mega'],
    ['comp0cker evolved Kakuna to Beedrill ex on the Bench.', 'beedrill'],
    ['comp0cker evolved Trumbeak to Toucannon on the Bench.', 'toucannon'],
    ['comp0cker evolved Toxel to Toxtricity on the Bench.', 'toxtricity'],
    ["comp0cker evolved Ethan's Quilava to Ethan's Typhlosion on the Bench.", 'typhlosion'],
    ['comp0cker evolved Lampent to Mega Chandelure ex on the Bench.', 'chandelure-mega'],
    ["comp0cker evolved Steven's Metang to Steven's Metagross ex on the Bench.", 'metagross'],
    ['comp0cker played Mega Kangaskhan ex to the Bench.', 'kangaskhan-mega'],
    ['comp0cker evolved Electrike to Mega Manectric ex on the Bench.', 'manectric-mega'],
    ['comp0cker evolved Ivysaur to Mega Venusaur ex on the Bench.', 'venusaur-mega'],
    ['comp0cker evolved Tynamo to Eelektrik on the Bench.', 'eelektrik'],
    ['comp0cker played Mega Diancie ex to the Bench.', 'diancie-mega'],
    ['comp0cker evolved Yanma to Yanmega ex on the Bench.', 'yanmega'],
    ['comp0cker played Mega Darkrai ex to the Bench.', 'darkrai-mega'],
    ['comp0cker evolved Minccino to Cinccino ex on the Bench.', 'cinccino'],
    ['comp0cker played Mega Rayquaza ex to the Bench.', 'rayquaza-mega'],
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

  it('keeps existing associations: Impidimp still maps to grimmsnarl,froslass', () => {
    expect(determineArchetype(["comp0cker played Marnie's Impidimp to the Bench.", "comp0cker evolved Marnie's Morgrem to Marnie's Grimmsnarl ex on the Bench."], 'comp0cker', 'en')).toEqual('grimmsnarl,froslass');
  });

  it('Radiant Greninja alone does not count as a Greninja deck', () => {
    expect(determineArchetype(['comp0cker played Radiant Greninja to the Bench.'], 'comp0cker', 'en')).toBeUndefined();
  });

  it('plain Rayquaza is not Mega Rayquaza', () => {
    expect(determineArchetype(['comp0cker played Rayquaza to the Bench.'], 'comp0cker', 'en')).toBeUndefined();
  });

  it('Mega Rayquaza beats Mega Kangaskhan regardless of log order', () => {
    const ray = 'comp0cker played Mega Rayquaza ex to the Bench.';
    const kang = 'comp0cker played Mega Kangaskhan ex to the Bench.';
    expect(determineArchetype([ray, kang], 'comp0cker', 'en')).toEqual('rayquaza-mega');
    expect(determineArchetype([kang, ray], 'comp0cker', 'en')).toEqual('rayquaza-mega');
    expect(determineArchetype([kang], 'comp0cker', 'en')).toEqual('kangaskhan-mega');
  });

  it('Talonflame Dusknoir matches Talonflame with any Dusknoir-line card and always returns talonflame,dusknoir', () => {
    const talon = 'comp0cker played Talonflame ex to the Bench.';
    const dusknoir = 'comp0cker played Dusknoir to the Bench.';
    const dusclops = 'comp0cker played Dusclops to the Bench.';
    const duskull = 'comp0cker played Duskull to the Bench.';
    const kang = 'comp0cker played Mega Kangaskhan ex to the Bench.';
    const fletchling = 'comp0cker played Fletchling to the Bench.';
    expect(determineArchetype([talon, duskull], 'comp0cker', 'en')).toEqual('talonflame,dusknoir');
    expect(determineArchetype([talon, dusclops], 'comp0cker', 'en')).toEqual('talonflame,dusknoir');
    expect(determineArchetype([talon, dusknoir], 'comp0cker', 'en')).toEqual('talonflame,dusknoir');
    expect(determineArchetype([dusknoir, talon], 'comp0cker', 'en')).toEqual('talonflame,dusknoir');
    expect(determineArchetype([kang, talon, duskull], 'comp0cker', 'en')).toEqual('talonflame,dusknoir');
    expect(determineArchetype([kang, talon, dusknoir], 'comp0cker', 'en')).toEqual('talonflame,dusknoir');
    expect(determineArchetype([duskull], 'comp0cker', 'en')).toBeUndefined();
    expect(determineArchetype([dusclops], 'comp0cker', 'en')).toBeUndefined();
    expect(determineArchetype([dusknoir], 'comp0cker', 'en')).toBeUndefined();
    expect(determineArchetype([talon], 'comp0cker', 'en')).toBeUndefined();
    expect(determineArchetype([fletchling, duskull], 'comp0cker', 'en')).toBeUndefined();
    expect(determineArchetype([kang, talon], 'comp0cker', 'en')).toEqual('kangaskhan-mega');
    expect(determineArchetype([kang, duskull], 'comp0cker', 'en')).toEqual('kangaskhan-mega');
  });
});
