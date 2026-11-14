import fs from 'fs';
import path from 'path';
import loadTranslations from '../../app/general-translation/loadTranslations';
import gtConfig from '../../gt.config.json';

const translationsDir = path.join(process.cwd(), 'public', '_gt');
const filenames = fs.readdirSync(translationsDir);
const originalFetch = global.fetch;
const fetchMock = jest.fn();

beforeEach(() => {
  global.fetch = fetchMock;
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (url: string) => {
    const filename = url.replace('/_gt/', '');
    // Match case explicitly, including on Windows, to model production hosting.
    const exists = filenames.includes(filename);
    return {
      ok: exists,
      json: async () => JSON.parse(fs.readFileSync(path.join(translationsDir, filename), 'utf8')),
    };
  });
});

afterEach(() => {
  global.fetch = originalFetch;
});

it.each(gtConfig.locales)('loads the local catalog for %s', async (locale) => {
  const translations = await loadTranslations(locale);

  expect(translations['tournaments.rounds.round']).toBeTruthy();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock).toHaveBeenCalledWith(`/_gt/${locale}.json`);
});

it('loads Simplified Chinese with a lowercase script tag', async () => {
  const translations = await loadTranslations('zh-hans');

  expect(translations['tournaments.rounds.result']).toBe('结果');
  expect(fetchMock).toHaveBeenCalledWith('/_gt/zh-Hans.json');
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it.each([
  ['ko-KR', 'ko'],
  ['pt-BR', 'pt'],
  ['pt-PT', 'pt'],
])('falls back from %s to %s', async (locale, fallback) => {
  const translations = await loadTranslations(locale);

  expect(translations['tournaments.rounds.round']).toBeTruthy();
  expect(fetchMock).toHaveBeenLastCalledWith(`/_gt/${fallback}.json`);
});

it('uses source text when no catalog is available', async () => {
  await expect(loadTranslations('xx')).resolves.toEqual({});
  expect(fetchMock).toHaveBeenLastCalledWith('/_gt/en.json');
});

it('tries the base language after a request fails', async () => {
  fetchMock.mockRejectedValueOnce(new Error('Network error'));

  const translations = await loadTranslations('pt-BR');

  expect(translations['tournaments.rounds.round']).toBe('Rodada');
  expect(fetchMock).toHaveBeenLastCalledWith('/_gt/pt.json');
});
