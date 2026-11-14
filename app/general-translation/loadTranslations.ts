import gtConfig from '../../gt.config.json';

export default async function loadTranslations(locale: string) {
  const normalizedLocale = locale.toLowerCase();
  const supportedLocales = [gtConfig.defaultLocale, ...gtConfig.locales];
  const localesToTry = [
    normalizedLocale,
    normalizedLocale.split('-')[0],
    'en',
  ]
    .map((candidate) => supportedLocales.find((supported) => supported.toLowerCase() === candidate) ?? candidate)
    .filter((value, index, self) => self.indexOf(value) === index);

  for (const localeToTry of localesToTry) {
    try {
      const response = await fetch(`/_gt/${localeToTry}.json`);
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Try the next fallback locale.
    }
  }

  return {};
}
