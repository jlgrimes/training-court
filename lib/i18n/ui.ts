export type UILocale = 'en' | 'ko';

export type UIKey =
  | 'common.cancel'
  | 'common.deck'
  | 'common.record'
  | 'common.result'
  | 'common.round'
  | 'common.saving'
  | 'common.win_rate'
  | 'matchups.all_formats'
  | 'matchups.last_played'
  | 'matchups.logs'
  | 'matchups.no_data'
  | 'matchups.title'
  | 'matchups.tournaments'
  | 'tournament.add_round'
  | 'tournament.opponent_deck'
  | 'tournament.other_outcome'
  | 'tournament.round_number'
  | 'tournament.update_round'
  | 'tournament.game_number'
  | 'tournament.first'
  | 'tournament.second';

export const UI_STRINGS: Record<UILocale, Record<UIKey, string>> = {
  en: {
    'common.cancel': 'Cancel',
    'common.deck': 'Deck',
    'common.record': 'Record',
    'common.result': 'Result',
    'common.round': 'Round',
    'common.saving': 'Saving...',
    'common.win_rate': 'Win rate',
    'matchups.all_formats': 'All formats',
    'matchups.last_played': 'Last played',
    'matchups.logs': 'Logs',
    'matchups.no_data': 'No matchup data for this filter.',
    'matchups.title': 'Matchups',
    'matchups.tournaments': 'Tournaments',
    'tournament.add_round': 'Add round',
    'tournament.opponent_deck': "Opponent's deck",
    'tournament.other_outcome': 'Other outcome',
    'tournament.round_number': 'Round {roundNumber}',
    'tournament.update_round': 'Update round',
    'tournament.game_number': 'Game {gameNumber}',
    'tournament.first': '1st',
    'tournament.second': '2nd',
  },
  ko: {
    'common.cancel': '\uCDE8\uC18C',
    'common.deck': '\uB371',
    'common.record': '\uC131\uC801',
    'common.result': '\uACB0\uACFC',
    'common.round': '\uB77C\uC6B4\uB4DC',
    'common.saving': '\uC800\uC7A5 \uC911...',
    'common.win_rate': '\uC2B9\uB960',
    'matchups.all_formats': '\uBAA8\uB4E0 \uD3EC\uB9F7',
    'matchups.last_played': '\uB9C8\uC9C0\uB9C9 \uD50C\uB808\uC774',
    'matchups.logs': '\uB85C\uADF8',
    'matchups.no_data': '\uD604\uC7AC \uD544\uD130\uC5D0 \uB300\uD55C \uB9E4\uCE58\uC5C5 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.',
    'matchups.title': '\uB9E4\uCE58\uC5C5',
    'matchups.tournaments': '\uD1A0\uB108\uBA3C\uD2B8',
    'tournament.add_round': '\uB77C\uC6B4\uB4DC \uCD94\uAC00',
    'tournament.opponent_deck': '\uC0C1\uB300 \uB371',
    'tournament.other_outcome': '\uB2E4\uB978 \uACB0\uACFC',
    'tournament.round_number': '{roundNumber}\uB77C\uC6B4\uB4DC',
    'tournament.update_round': '\uB77C\uC6B4\uB4DC \uC5C5\uB370\uC774\uD2B8',
    'tournament.game_number': '{gameNumber}\uAC8C\uC784',
    'tournament.first': '1\uD134',
    'tournament.second': '2\uD134',
  },
};

export const normalizeLocale = (locale: string | null | undefined): UILocale => {
  if (locale === 'ko') return 'ko';
  return 'en';
};

export const uiString = (locale: UILocale, key: UIKey, vars?: Record<string, string | number>) => {
  const template = UI_STRINGS[locale]?.[key] ?? UI_STRINGS.en[key] ?? key;
  if (!vars) return template;

  return template.replace(/\{(\w+)\}/g, (_, varName: string) => {
    const val = vars[varName];
    return val == null ? `{${varName}}` : String(val);
  });
};

