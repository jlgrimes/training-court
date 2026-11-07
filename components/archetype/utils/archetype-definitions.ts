/**
 * Deck archetype definitions used by the scored deck detector.
 *
 * Weights:
 *  - SIGNATURE: the attacker/engine a deck is named after.
 *  - LINE: pre-evolutions and other cards that strongly suggest the deck but
 *    also show up elsewhere.
 *  - SUPPORT: tech/support Pokemon that appear across many decks. They only
 *    count a little and can never name a deck on their own.
 *  - IGNORE: cards whose name contains a deck's name but must not count for
 *    it (e.g. "Radiant Charizard" is a tech in Regidrago, not a Charizard deck).
 *
 * Format scoping: the detector accepts the log's format and a definition may
 * list `formats`, but NO definition is format-scoped yet because rotation data
 * hasn't been confirmed. Today every definition applies to every format.
 */

export const SIGNATURE = 3;
export const LINE = 1.5;
export const SUPPORT = 0.5;
export const IGNORE = 0;

export interface ArchetypeCard {
  /** English card name (without ex / V / VSTAR suffixes), case-insensitive. */
  name: string;
  weight: number;
}

export interface ArchetypeDefinition {
  /** Slug returned to the app (sprite names, comma-separated for pairs). */
  slug: string;
  cards: ArchetypeCard[];
  /** All of these card names must be present for the definition to apply. */
  requires?: string[];
  /** Extra score for a satisfied pair, so a pair beats each of its halves. */
  comboBonus?: number;
  /** Format codes this definition is limited to. Omit when unknown. */
  formats?: string[];
}

const sig = (name: string): ArchetypeCard => ({ name, weight: SIGNATURE });
const line = (name: string): ArchetypeCard => ({ name, weight: LINE });

/**
 * Decks from the Limitless deck list (https://limitlesstcg.com/decks, read
 * 2026-11-06). Only decks with a clear named Pokemon are included; "Basic
 * Box", "Festival Lead" and "Mew Box" have no single signature card and fall
 * back to the general list / unknown.
 */
export const currentArchetypeDefinitions: ArchetypeDefinition[] = [
  { slug: 'dragapult', cards: [sig('dragapult'), line('drakloak'), line('dreepy')] },
  { slug: 'slowking', cards: [sig('slowking'), line('slowpoke')] },
  { slug: 'zoroark', cards: [sig("n's zoroark"), line("n's zorua"), sig('zoroark'), line('zorua')] },
  { slug: 'alakazam', cards: [sig('alakazam'), line('kadabra'), line('abra')] },
  { slug: 'hydrapple', cards: [sig('hydrapple'), line('dipplin'), line('applin')] },
  { slug: 'dipplin', cards: [sig('dipplin'), line('applin')] },
  { slug: 'dhelmise', cards: [sig('dhelmise')] },
  { slug: 'lopunny-mega', cards: [sig('mega lopunny'), line('buneary')] },
  { slug: 'crustle', cards: [sig('crustle'), line('dwebble')] },
  { slug: 'excadrill-mega', cards: [sig('mega excadrill'), line('drilbur')] },
  { slug: 'lucario-mega', cards: [sig('mega lucario'), line('riolu')] },
  { slug: 'honchkrow', cards: [sig("team rocket's honchkrow"), sig("rocket's honchkrow"), sig('honchkrow'), line("team rocket's murkrow"), line('murkrow')] },
  { slug: 'sharpedo-mega', cards: [sig('mega sharpedo'), line('carvanha')] },
  { slug: 'garchomp', cards: [sig("cynthia's garchomp"), line("cynthia's gabite"), line("cynthia's gible"), sig('garchomp'), line('gabite'), line('gible')] },
  { slug: 'meganium,ogerpon', cards: [sig('meganium'), line('bayleef'), line('chikorita'), sig('ogerpon')], requires: ['meganium', 'ogerpon'], comboBonus: 1 },
  { slug: 'meganium', cards: [sig('meganium'), line('bayleef'), line('chikorita')] },
  { slug: 'grimmsnarl,froslass', cards: [sig("marnie's grimmsnarl"), sig('grimmsnarl'), sig('froslass'), line('snorunt')], requires: ['grimmsnarl', 'froslass'], comboBonus: 1 },
  { slug: 'grimmsnarl', cards: [sig("marnie's grimmsnarl"), line("marnie's morgrem"), line("marnie's impidimp"), sig('grimmsnarl'), line('morgrem'), line('impidimp')] },
  { slug: 'spidops,mewtwo', cards: [sig('spidops'), line('tarountula'), sig('mewtwo')], requires: ['spidops', 'mewtwo'], comboBonus: 1 },
  { slug: 'spidops', cards: [sig('spidops'), line('tarountula')] },
  { slug: 'mewtwo', cards: [sig("team rocket's mewtwo"), sig("rocket's mewtwo"), sig('mewtwo')] },
  { slug: 'greninja', cards: [sig('greninja'), line('frogadier'), line('froakie')] },
  { slug: 'raging-bolt,ogerpon', cards: [sig('raging bolt'), sig('ogerpon')], requires: ['raging bolt', 'ogerpon'], comboBonus: 1 },
  { slug: 'raging-bolt', cards: [sig('raging bolt')] },
  { slug: 'trevenant', cards: [sig("hop's trevenant"), line("hop's phantump"), sig('trevenant'), line('phantump')] },
  { slug: 'starmie-mega', cards: [sig('mega starmie'), line('staryu')] },
  { slug: 'clefairy', cards: [sig("lillie's clefairy")] },
  { slug: 'absol-mega', cards: [sig('mega absol')] },
];

/** Older pre-evolution hints carried over from the previous detector. */
export const legacyLineDefinitions: ArchetypeDefinition[] = [
  { slug: 'charizard', cards: [line('charmander'), line('charmeleon')] },
  { slug: 'chien-pao', cards: [line('frigibax'), line('arctibax'), line('baxcalibur')] },
  { slug: 'gardevoir', cards: [line('ralts'), line('kirlia')] },
  { slug: 'gardevoir,jellicent', cards: [sig('gardevoir'), sig('jellicent')], requires: ['gardevoir', 'jellicent'], comboBonus: 1 },
  { slug: 'banette', cards: [line('shuppet')] },
  { slug: 'joltik', cards: [sig('joltik')] },
  { slug: 'venomoth', cards: [line('venonat')] },
  { slug: 'typhlosion', cards: [sig('typhlosion'), line('quilava'), line('cyndaquil')] },
  { slug: 'flareon', cards: [sig('flareon')] },
  { slug: 'gholdengo', cards: [line('gimmighoul')] },
  { slug: 'toedscruel', cards: [line('toedscool')] },
  { slug: 'blissey', cards: [line('chansey')] },
  { slug: 'milotic,girafarig', cards: [sig('milotic'), sig('girafarig'), line('farigiraf')], requires: ['milotic', 'girafarig'], comboBonus: 1 },
];

/** Support Pokemon seen across many decks. */
export const supportCards: ArchetypeCard[] = [
  { name: 'ogerpon', weight: SUPPORT },
  { name: 'pidgeot', weight: SUPPORT },
  { name: 'flutter mane', weight: SUPPORT },
  { name: 'sneasler', weight: SUPPORT },
  { name: 'iron valiant', weight: SUPPORT },
];

/** Names that contain another deck's name but must never count toward it. */
export const ignoredCards: string[] = ['radiant charizard', 'radiant greninja'];
