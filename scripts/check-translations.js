const fs = require('fs');
const path = require('path');

const root = process.cwd();
const configPath = path.join(root, 'gt.config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const locales = config.locales || [];
const translationsDir = path.join(root, 'public', '_gt');
const sourceDirs = ['app', 'components']
  .map((dir) => path.join(root, dir))
  .filter((dir) => fs.existsSync(dir));

let hasError = false;

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
  } catch (error) {
    console.error(`Could not read ${path.relative(root, filePath)}: ${error.message}`);
    hasError = true;
    return {};
  }
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(entryPath));
    } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      files.push(entryPath);
    }
  }

  return files;
}

function extractTranslationKeys() {
  const keys = new Set();
  const patterns = [
    /<T\s+id=["']([^"']+)["']/g,
    /<TranslatedText\s+id=["']([^"']+)["']/g,
    /\$id:\s*["']([^"']+)["']/g,
  ];

  for (const sourceDir of sourceDirs) {
    for (const filePath of walk(sourceDir)) {
      const source = fs.readFileSync(filePath, 'utf8');
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(source)) !== null) {
          keys.add(match[1]);
        }
      }
    }
  }

  return keys;
}

for (const locale of locales) {
  const localePath = path.join(translationsDir, `${locale}.json`);
  if (!fs.existsSync(localePath)) {
    console.error(`Missing translation file: ${path.relative(root, localePath)}`);
    hasError = true;
  }
}

const localeEntries = locales.map((locale) => {
  const localePath = path.join(translationsDir, `${locale}.json`);
  return [locale, fs.existsSync(localePath) ? readJson(localePath) : {}];
});

const allKeys = new Set();
for (const [, translations] of localeEntries) {
  for (const key of Object.keys(translations)) {
    allKeys.add(key);
  }
}

const sourceKeys = extractTranslationKeys();
for (const key of sourceKeys) {
  allKeys.add(key);
}

for (const [locale, translations] of localeEntries) {
  const keys = new Set(Object.keys(translations));
  const missing = [...allKeys].filter((key) => !keys.has(key));
  if (missing.length > 0) {
    console.error(`${locale}.json is missing ${missing.length} translation keys:`);
    for (const key of missing) {
      console.error(`  - ${key}`);
    }
    hasError = true;
  }
}

const unusedKeys = [...allKeys].filter((key) => !sourceKeys.has(key));
if (unusedKeys.length > 0) {
  console.warn(`${unusedKeys.length} translation keys are not referenced in source files:`);
  for (const key of unusedKeys) {
    console.warn(`  - ${key}`);
  }
}

if (hasError) {
  process.exit(1);
}

console.log(`Translation files are present and aligned for ${locales.length} locales.`);
