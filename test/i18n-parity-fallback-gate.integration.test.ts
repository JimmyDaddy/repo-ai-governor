import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

interface I18nParityFailure {
  rule_id: string;
  message: string;
  details: Record<string, unknown>;
}

interface I18nParityResult {
  status: 'pass' | 'fail';
  failures: I18nParityFailure[];
  locale_key_counts: Record<string, number>;
  default_locale: string;
  fallback_locale: string;
  supported_locales: string[];
  resource_locales: string[];
}

const SCRIPT_PATH = resolve(process.cwd(), 'scripts/governance/check-i18n-parity-fallback.js');

/**
 * Executes i18n parity/fallback gate and parses machine output.
 * @returns Parsed gate output.
 */
function runI18nParityFallbackGate(): I18nParityResult {
  const stdout = execFileSync(process.execPath, [SCRIPT_PATH, '--format', 'json'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return JSON.parse(stdout) as I18nParityResult;
}

describe('i18n parity/fallback gate smoke', () => {
  it('passes with aligned locale keys and resolvable fallback defaults', () => {
    const result = runI18nParityFallbackGate();

    expect(result.status).toBe('pass');
    expect(result.failures).toHaveLength(0);
    expect(result.default_locale).toBe('zh-CN');
    expect(result.fallback_locale).toBe('en-US');
    expect(result.supported_locales).toEqual(['zh-CN', 'en-US']);
    expect(result.resource_locales).toEqual(['en-US', 'zh-CN']);
    expect(result.locale_key_counts['en-US']).toBeGreaterThan(0);
    expect(result.locale_key_counts['zh-CN']).toBe(result.locale_key_counts['en-US']);
  });
});
