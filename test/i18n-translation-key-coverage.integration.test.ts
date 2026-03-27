import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { EN_US_TRANSLATIONS } from '../packages/shared/src/i18n/locales/en-us.js';
import { ZH_CN_TRANSLATIONS } from '../packages/shared/src/i18n/locales/zh-cn.js';

interface TranslationTree {
  [key: string]: string | TranslationTree;
}

const CLI_TRANSLATION_SOURCE_PATTERNS = [
  {
    filePath: resolve(process.cwd(), 'apps/cli/src/main.ts'),
    pattern: /\b(?:runtimeI18n|i18nRuntime)\.t\((["'])([^"']+)\1/g,
  },
  {
    filePath: resolve(process.cwd(), 'apps/cli/src/cli-output-presenter.ts'),
    pattern: /\bthis\.translateText\((["'])([^"']+)\1/g,
  },
] as const;

/**
 * Recursively flattens one translation tree into dotted leaf-key paths.
 * @param input Nested translation tree.
 * @param parentKey Current dotted prefix.
 * @returns Stable dotted leaf-key paths.
 */
function flattenTranslationKeys(input: TranslationTree, parentKey = ''): string[] {
  const flattenedKeys: string[] = [];

  for (const [key, value] of Object.entries(input)) {
    const dottedKey = parentKey.length > 0 ? `${parentKey}.${key}` : key;
    if (typeof value === 'string') {
      flattenedKeys.push(dottedKey);
      continue;
    }

    flattenedKeys.push(...flattenTranslationKeys(value, dottedKey));
  }

  return flattenedKeys;
}

/**
 * Extracts translation keys referenced by the CLI entrypoint.
 * @returns Sorted list of unique translation keys.
 */
function readCliTranslationKeys(): string[] {
  const usedKeys = new Set<string>();

  for (const sourceDescriptor of CLI_TRANSLATION_SOURCE_PATTERNS) {
    const source = readFileSync(sourceDescriptor.filePath, 'utf8');
    for (const match of source.matchAll(sourceDescriptor.pattern)) {
      const translationKey = match[2]?.trim();
      if (!translationKey) {
        continue;
      }
      usedKeys.add(translationKey);
    }
  }

  return Array.from(usedKeys).sort((left, right) => left.localeCompare(right, 'en'));
}

describe('CLI i18n translation key coverage', () => {
  it('keeps every CLI translation key backed by both zh-CN and en-US resources', () => {
    const cliTranslationKeys = readCliTranslationKeys();
    const zhCnKeys = new Set(flattenTranslationKeys(ZH_CN_TRANSLATIONS as TranslationTree));
    const enUsKeys = new Set(flattenTranslationKeys(EN_US_TRANSLATIONS as TranslationTree));

    const missingZhCnKeys = cliTranslationKeys.filter(
      (translationKey) => !zhCnKeys.has(translationKey),
    );
    const missingEnUsKeys = cliTranslationKeys.filter(
      (translationKey) => !enUsKeys.has(translationKey),
    );

    expect(cliTranslationKeys.length).toBeGreaterThan(0);
    expect(missingZhCnKeys).toEqual([]);
    expect(missingEnUsKeys).toEqual([]);
  });
});
