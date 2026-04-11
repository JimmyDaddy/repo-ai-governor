import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { WorkspaceMode } from '@repo-ai-governor/shared';
import { CliUserConfigService } from '../../src/runtime/cli-user-config-service.js';

describe('CliUserConfigService', () => {
  it('loads legacy cli-preferences theme when canonical user-config is absent', async () => {
    const temporaryHomeRoot = await mkdtemp(resolve(tmpdir(), 'cli-user-config-service-'));
    const service = new CliUserConfigService();
    const legacyPreferencePath = resolve(
      temporaryHomeRoot,
      '.repo-ai-governor',
      'cli-preferences.yaml',
    );

    try {
      await mkdir(resolve(temporaryHomeRoot, '.repo-ai-governor'), { recursive: true });
      await writeFile(
        legacyPreferencePath,
        ['ui:', '  react:', '    theme: catppuccin', ''].join('\n'),
        'utf8',
      );

      expect(
        service.loadThemePreference({
          environment: {
            ...process.env,
            HOME: temporaryHomeRoot,
          },
        }),
      ).toBe('catppuccin');
    } finally {
      await rm(temporaryHomeRoot, { recursive: true, force: true });
    }
  });

  it('lists stable populated entries after set and unset mutations', () => {
    const service = new CliUserConfigService();
    let document = service.setValue({}, 'workspace.mode_preference', WorkspaceMode.TOOL_MANAGED);
    document = service.setValue(document, 'ui.react.theme', 'calm');
    document = service.setValue(document, 'tools.codex.remoteApi.model', 'gpt-5');

    expect(service.listValues(document)).toEqual([
      { keyPath: 'workspace.mode_preference', value: 'tool_managed' },
      { keyPath: 'ui.react.theme', value: 'calm' },
      { keyPath: 'tools.codex.remoteApi.model', value: 'gpt-5' },
    ]);

    const cleanedDocument = service.unsetValue(document, 'ui.react.theme');
    expect(service.listValues(cleanedDocument)).toEqual([
      { keyPath: 'workspace.mode_preference', value: 'tool_managed' },
      { keyPath: 'tools.codex.remoteApi.model', value: 'gpt-5' },
    ]);
  });

  it('persists an explicit theme tombstone so legacy fallback can be cleared', async () => {
    const temporaryHomeRoot = await mkdtemp(resolve(tmpdir(), 'cli-user-config-theme-clear-'));
    const service = new CliUserConfigService();
    const environment = {
      ...process.env,
      HOME: temporaryHomeRoot,
    };
    const configPath = resolve(temporaryHomeRoot, '.repo-ai-governor', 'user-config.yaml');
    const legacyPreferencePath = resolve(
      temporaryHomeRoot,
      '.repo-ai-governor',
      'cli-preferences.yaml',
    );

    try {
      await mkdir(resolve(temporaryHomeRoot, '.repo-ai-governor'), { recursive: true });
      await writeFile(
        legacyPreferencePath,
        ['ui:', '  react:', '    theme: catppuccin', ''].join('\n'),
        'utf8',
      );

      const clearedDocument = service.unsetValue(
        service.loadCanonicalConfig({ environment }),
        'ui.react.theme',
      );
      await writeFile(configPath, service.renderConfigContent(clearedDocument), 'utf8');

      expect(service.loadThemePreference({ environment })).toBeNull();
      expect(await readFile(configPath, 'utf8')).toContain('theme: null');
    } finally {
      await rm(temporaryHomeRoot, { recursive: true, force: true });
    }
  });
});
