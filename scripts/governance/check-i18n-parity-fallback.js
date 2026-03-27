#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Script } from 'node:vm';

import { gateFail, gateInfo, gatePass } from './gate-output.js';

const GATE_NAME = 'i18n-parity-fallback';
const I18N_CONSTANTS_PATH = 'packages/shared/src/constants/i18n.constant.ts';
const LOCALE_SOURCE_DEFINITIONS = [
  {
    locale: 'en-US',
    filePath: 'packages/shared/src/i18n/locales/en-us.ts',
    exportName: 'EN_US_TRANSLATIONS',
  },
  {
    locale: 'zh-CN',
    filePath: 'packages/shared/src/i18n/locales/zh-cn.ts',
    exportName: 'ZH_CN_TRANSLATIONS',
  },
];
const FORMAT_VALUES = new Set(['text', 'json']);
const OBJECT_LITERAL_LEAF_TYPES = new Set(['string']);

/**
 * Resolves CLI options for output format.
 * @param {string[]} argv Raw process arguments after script path.
 * @returns {{format: "text" | "json"}}
 */
function resolveCliOptions(argv) {
  /** @type {{format: "text" | "json"}} */
  const options = {
    format: 'text',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--format') {
      const nextValue = argv[index + 1];
      if (!nextValue) {
        throw new Error('Missing value for "--format".');
      }
      options.format = readFormatValue(nextValue);
      index += 1;
      continue;
    }

    if (argument.startsWith('--format=')) {
      options.format = readFormatValue(argument.slice('--format='.length));
      continue;
    }

    throw new Error(`Unsupported option: ${argument}`);
  }

  return options;
}

/**
 * Validates one format value.
 * @param {string} value Raw format argument.
 * @returns {"text" | "json"}
 */
function readFormatValue(value) {
  const normalizedValue = value.trim().toLowerCase();
  if (!FORMAT_VALUES.has(normalizedValue)) {
    throw new Error(`Unsupported format "${value}". Expected "text" or "json".`);
  }

  return /** @type {"text" | "json"} */ (normalizedValue);
}

/**
 * Reads one UTF-8 source file from repository root.
 * @param {string} relativePath Relative path.
 * @returns {string}
 */
function readSource(relativePath) {
  const absolutePath = resolve(process.cwd(), relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Source file not found: ${relativePath}`);
  }

  return readFileSync(absolutePath, 'utf8');
}

/**
 * Extracts one `export const` object-literal expression ending with `as const`.
 * @param {string} content Source text.
 * @param {string} exportName Export const name.
 * @returns {string}
 */
function extractObjectLiteralExpression(content, exportName) {
  const pattern = new RegExp(
    `export\\s+const\\s+${escapeRegExp(exportName)}\\s*=\\s*([\\s\\S]*?)\\s+as\\s+const\\s*;`,
    'u',
  );
  const matched = content.match(pattern);
  if (!matched || !matched[1]) {
    throw new Error(`Export "${exportName}" with "as const" object literal was not found.`);
  }

  return matched[1].trim();
}

/**
 * Evaluates one object-literal expression in isolated VM context.
 * @param {string} expression Object-literal expression.
 * @param {string} sourceLabel Source label for diagnostics.
 * @returns {Record<string, unknown>}
 */
function evaluateObjectLiteral(expression, sourceLabel) {
  const script = new Script(`(${expression})`, {
    filename: sourceLabel,
  });
  const evaluated = script.runInNewContext(Object.create(null), {
    timeout: 1000,
  });

  if (!isPlainRecord(evaluated)) {
    throw new Error(`Expression in ${sourceLabel} must evaluate to a plain object.`);
  }

  return evaluated;
}

/**
 * Parses locale enum values and i18n defaults from constants source.
 * @param {string} content Constants source text.
 * @returns {{
 *   localeEnumMap: Record<string, string>,
 *   defaultLocale: string,
 *   fallbackLocale: string,
 *   supportedLocales: string[]
 * }}
 */
function parseI18nConstants(content) {
  const localeEnumMap = parseLocaleEnum(content);
  const defaultLocale = resolveLocaleAssignment(
    content,
    'DEFAULT_I18N_LOCALE',
    localeEnumMap,
    Object.create(null),
  );
  const fallbackLocale = resolveLocaleAssignment(
    content,
    'DEFAULT_I18N_FALLBACK_LOCALE',
    localeEnumMap,
    {
      DEFAULT_I18N_LOCALE: defaultLocale,
    },
  );
  const supportedLocales = parseSupportedLocales(content, localeEnumMap, {
    DEFAULT_I18N_LOCALE: defaultLocale,
    DEFAULT_I18N_FALLBACK_LOCALE: fallbackLocale,
  });

  return {
    localeEnumMap,
    defaultLocale,
    fallbackLocale,
    supportedLocales,
  };
}

/**
 * Parses `Locale` enum entries.
 * @param {string} content Constants source text.
 * @returns {Record<string, string>}
 */
function parseLocaleEnum(content) {
  const enumBlock = content.match(/export\s+enum\s+Locale\s*\{([\s\S]*?)\}/u);
  if (!enumBlock || !enumBlock[1]) {
    throw new Error('Enum "Locale" was not found in i18n constants.');
  }

  /** @type {Record<string, string>} */
  const localeEnumMap = {};
  const enumEntryPattern = /([A-Z0-9_]+)\s*=\s*["']([^"']+)["']/gu;
  let matchedEntry = enumEntryPattern.exec(enumBlock[1]);
  while (matchedEntry) {
    localeEnumMap[matchedEntry[1]] = matchedEntry[2];
    matchedEntry = enumEntryPattern.exec(enumBlock[1]);
  }

  if (Object.keys(localeEnumMap).length === 0) {
    throw new Error('Enum "Locale" does not contain any value entries.');
  }

  return localeEnumMap;
}

/**
 * Resolves one locale constant assignment value.
 * @param {string} content Constants source text.
 * @param {string} constantName Constant name.
 * @param {Record<string, string>} localeEnumMap Enum map.
 * @param {Record<string, string>} constantMap Previously resolved constants.
 * @returns {string}
 */
function resolveLocaleAssignment(content, constantName, localeEnumMap, constantMap) {
  const assignmentPattern = new RegExp(
    `export\\s+const\\s+${escapeRegExp(constantName)}\\s*=\\s*([^;]+);`,
    'u',
  );
  const matched = content.match(assignmentPattern);
  if (!matched || !matched[1]) {
    throw new Error(`Constant "${constantName}" assignment was not found.`);
  }

  return resolveLocaleToken(matched[1].trim(), localeEnumMap, constantMap, constantName);
}

/**
 * Parses default supported locale list.
 * @param {string} content Constants source text.
 * @param {Record<string, string>} localeEnumMap Enum map.
 * @param {Record<string, string>} constantMap Previously resolved constants.
 * @returns {string[]}
 */
function parseSupportedLocales(content, localeEnumMap, constantMap) {
  const arrayMatch = content.match(
    /export\s+const\s+DEFAULT_I18N_SUPPORTED_LOCALES\s*=\s*\[([\s\S]*?)\]\s*as\s*const\s*;/u,
  );
  if (!arrayMatch || !arrayMatch[1]) {
    throw new Error('Constant "DEFAULT_I18N_SUPPORTED_LOCALES" assignment was not found.');
  }

  const rawItems = arrayMatch[1]
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  if (rawItems.length === 0) {
    throw new Error('"DEFAULT_I18N_SUPPORTED_LOCALES" must contain at least one item.');
  }

  return rawItems.map((token) =>
    resolveLocaleToken(token, localeEnumMap, constantMap, 'DEFAULT_I18N_SUPPORTED_LOCALES'),
  );
}

/**
 * Resolves one locale token from enum/constant/string references.
 * @param {string} token Raw token.
 * @param {Record<string, string>} localeEnumMap Enum map.
 * @param {Record<string, string>} constantMap Previously resolved constants.
 * @param {string} ownerName Current owner constant name.
 * @returns {string}
 */
function resolveLocaleToken(token, localeEnumMap, constantMap, ownerName) {
  if (
    (token.startsWith('"') && token.endsWith('"')) ||
    (token.startsWith("'") && token.endsWith("'"))
  ) {
    return token.slice(1, -1);
  }

  if (token.startsWith('Locale.')) {
    const enumKey = token.slice('Locale.'.length);
    const resolved = localeEnumMap[enumKey];
    if (!resolved) {
      throw new Error(`"${ownerName}" references unknown enum key: ${token}`);
    }

    return resolved;
  }

  if (constantMap[token]) {
    return constantMap[token];
  }

  throw new Error(`"${ownerName}" contains unsupported locale token: ${token}`);
}

/**
 * Flattens translation key paths from nested object-literal payload.
 * @param {Record<string, unknown>} source Translation source.
 * @param {string[]} parentPath Parent key path segments.
 * @param {Set<string>} outputKeySet Flattened key set output.
 */
function collectTranslationKeyPaths(source, parentPath, outputKeySet) {
  for (const [key, value] of Object.entries(source)) {
    const nextPath = [...parentPath, key];
    if (isPlainRecord(value)) {
      collectTranslationKeyPaths(value, nextPath, outputKeySet);
      continue;
    }

    const valueType = typeof value;
    if (!OBJECT_LITERAL_LEAF_TYPES.has(valueType)) {
      throw new Error(
        `Translation key "${nextPath.join('.')}" must resolve to string leaf, got ${valueType}.`,
      );
    }

    outputKeySet.add(nextPath.join('.'));
  }
}

/**
 * Evaluates i18n parity and fallback availability.
 * @returns {{
 *   status: "pass" | "fail",
 *   failures: Array<{rule_id: string, message: string, details: Record<string, unknown>}>,
 *   locale_key_counts: Record<string, number>,
 *   default_locale: string,
 *   fallback_locale: string,
 *   supported_locales: string[],
 *   resource_locales: string[]
 * }}
 */
function evaluateI18nParityFallbackGate() {
  /** @type {Array<{rule_id: string, message: string, details: Record<string, unknown>}>} */
  const failures = [];
  /** @type {Record<string, Set<string>>} */
  const localeKeySets = {};
  /** @type {Record<string, number>} */
  const localeKeyCounts = {};

  for (const definition of LOCALE_SOURCE_DEFINITIONS) {
    try {
      const content = readSource(definition.filePath);
      const expression = extractObjectLiteralExpression(content, definition.exportName);
      const translationsObject = evaluateObjectLiteral(expression, definition.filePath);
      const keySet = new Set();
      collectTranslationKeyPaths(translationsObject, [], keySet);
      localeKeySets[definition.locale] = keySet;
      localeKeyCounts[definition.locale] = keySet.size;
    } catch (error) {
      failures.push(
        buildFailure('locale_source_parse_failed', 'Failed to parse locale translation source.', {
          locale: definition.locale,
          file_path: definition.filePath,
          export_name: definition.exportName,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }

  const resolvedLocales = Object.keys(localeKeySets).sort((left, right) =>
    left.localeCompare(right),
  );
  const baselineLocale = resolvedLocales[0];
  if (!baselineLocale) {
    failures.push(
      buildFailure(
        'locale_source_empty',
        'No locale resources were parsed successfully from configured locale sources.',
        {},
      ),
    );
  } else {
    const baselineKeys = localeKeySets[baselineLocale];
    for (const locale of resolvedLocales) {
      if (locale === baselineLocale) {
        continue;
      }

      const currentKeys = localeKeySets[locale];
      const missingKeys = Array.from(baselineKeys).filter((key) => !currentKeys.has(key));
      const extraKeys = Array.from(currentKeys).filter((key) => !baselineKeys.has(key));

      if (missingKeys.length > 0) {
        failures.push(
          buildFailure(
            'locale_key_parity_missing',
            'Locale is missing translation keys from parity baseline.',
            {
              baseline_locale: baselineLocale,
              locale,
              missing_keys: missingKeys.sort((left, right) => left.localeCompare(right)),
            },
          ),
        );
      }

      if (extraKeys.length > 0) {
        failures.push(
          buildFailure(
            'locale_key_parity_extra',
            'Locale has keys not present in parity baseline.',
            {
              baseline_locale: baselineLocale,
              locale,
              extra_keys: extraKeys.sort((left, right) => left.localeCompare(right)),
            },
          ),
        );
      }
    }
  }

  let defaultLocale = '';
  let fallbackLocale = '';
  /** @type {string[]} */
  let supportedLocales = [];

  try {
    const constantsSource = readSource(I18N_CONSTANTS_PATH);
    const parsedConstants = parseI18nConstants(constantsSource);
    defaultLocale = parsedConstants.defaultLocale;
    fallbackLocale = parsedConstants.fallbackLocale;
    supportedLocales = parsedConstants.supportedLocales;
  } catch (error) {
    failures.push(
      buildFailure('i18n_constants_parse_failed', 'Failed to parse i18n constant defaults.', {
        path: I18N_CONSTANTS_PATH,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }

  const resourceLocales = Object.keys(localeKeySets).sort((left, right) =>
    left.localeCompare(right),
  );
  const resourceLocaleSet = new Set(resourceLocales);

  if (defaultLocale && !resourceLocaleSet.has(defaultLocale)) {
    failures.push(
      buildFailure(
        'i18n_default_locale_missing_resource',
        'DEFAULT_I18N_LOCALE must resolve to an existing locale resource.',
        {
          default_locale: defaultLocale,
          resource_locales: resourceLocales,
        },
      ),
    );
  }

  if (fallbackLocale && !resourceLocaleSet.has(fallbackLocale)) {
    failures.push(
      buildFailure(
        'i18n_fallback_locale_missing_resource',
        'DEFAULT_I18N_FALLBACK_LOCALE must resolve to an existing locale resource.',
        {
          fallback_locale: fallbackLocale,
          resource_locales: resourceLocales,
        },
      ),
    );
  }

  const supportedLocaleSet = new Set(supportedLocales);
  if (supportedLocaleSet.size !== supportedLocales.length) {
    failures.push(
      buildFailure(
        'i18n_supported_locale_duplicate',
        'DEFAULT_I18N_SUPPORTED_LOCALES must not contain duplicates.',
        {
          supported_locales: supportedLocales,
        },
      ),
    );
  }

  if (defaultLocale && !supportedLocaleSet.has(defaultLocale)) {
    failures.push(
      buildFailure(
        'i18n_supported_locale_missing_default',
        'DEFAULT_I18N_SUPPORTED_LOCALES must include DEFAULT_I18N_LOCALE.',
        {
          default_locale: defaultLocale,
          supported_locales: supportedLocales,
        },
      ),
    );
  }

  if (fallbackLocale && !supportedLocaleSet.has(fallbackLocale)) {
    failures.push(
      buildFailure(
        'i18n_supported_locale_missing_fallback',
        'DEFAULT_I18N_SUPPORTED_LOCALES must include DEFAULT_I18N_FALLBACK_LOCALE.',
        {
          fallback_locale: fallbackLocale,
          supported_locales: supportedLocales,
        },
      ),
    );
  }

  for (const supportedLocale of supportedLocales) {
    if (!resourceLocaleSet.has(supportedLocale)) {
      failures.push(
        buildFailure(
          'i18n_supported_locale_missing_resource',
          'Supported locale must map to an existing translation resource.',
          {
            locale: supportedLocale,
            supported_locales: supportedLocales,
            resource_locales: resourceLocales,
          },
        ),
      );
    }
  }

  return {
    status: failures.length === 0 ? 'pass' : 'fail',
    failures,
    locale_key_counts: localeKeyCounts,
    default_locale: defaultLocale,
    fallback_locale: fallbackLocale,
    supported_locales: supportedLocales,
    resource_locales: resourceLocales,
  };
}

/**
 * Builds one structured failure payload.
 * @param {string} ruleId Rule identifier.
 * @param {string} message Human-readable message.
 * @param {Record<string, unknown>} details Structured details payload.
 * @returns {{rule_id: string, message: string, details: Record<string, unknown>}}
 */
function buildFailure(ruleId, message, details) {
  return {
    rule_id: ruleId,
    message,
    details,
  };
}

/**
 * Prints text-mode gate summary for humans and CI logs.
 * @param {{
 *   status: "pass" | "fail",
 *   failures: Array<{rule_id: string, message: string, details: Record<string, unknown>}>,
 *   locale_key_counts: Record<string, number>,
 *   default_locale: string,
 *   fallback_locale: string,
 *   supported_locales: string[],
 *   resource_locales: string[]
 * }} result
 */
function printTextResult(result) {
  if (result.status === 'pass') {
    gatePass(
      GATE_NAME,
      `i18n parity/fallback check passed. locales=${result.resource_locales.join(', ')}`,
    );
    gateInfo(
      GATE_NAME,
      `default=${result.default_locale} fallback=${result.fallback_locale} supported=${result.supported_locales.join(', ')}`,
    );
    gateInfo(GATE_NAME, `key_counts=${JSON.stringify(result.locale_key_counts)}`);
    return;
  }

  gateFail(GATE_NAME, 'i18n parity/fallback check failed.');
  for (const failure of result.failures) {
    gateFail(GATE_NAME, `- rule=${failure.rule_id} message="${failure.message}"`);
    gateInfo(GATE_NAME, `  details=${JSON.stringify(failure.details)}`);
  }
}

/**
 * Escapes regex-special characters.
 * @param {string} value Raw text.
 * @returns {string}
 */
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

/**
 * Checks whether value is a plain record object.
 * @param {unknown} value Raw value.
 * @returns {value is Record<string, unknown>}
 */
function isPlainRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

const options = resolveCliOptions(process.argv.slice(2));
const result = evaluateI18nParityFallbackGate();

if (options.format === 'json') {
  console.info(JSON.stringify(result, null, 2));
} else {
  printTextResult(result);
}

if (result.status === 'fail') {
  process.exit(1);
}
