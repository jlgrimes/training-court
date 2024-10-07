export const SupportedLanguages = {
  English: 'English',
  German: 'German'
}

export const detectBattleLogLanguage = (log: string) => {
  if (log.includes('Setup')) return SupportedLanguages.English;
  // if (log.includes('Vorbereitung')) return SupportedLanguages.German;
  return null;
}