export default async function loadTranslations(locale: string) {
  const normalizedLocale = locale.toLowerCase();
  const localesToTry = [
    normalizedLocale,
    normalizedLocale.split('-')[0],
    'en',
  ].filter((value, index, self) => self.indexOf(value) === index);

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
