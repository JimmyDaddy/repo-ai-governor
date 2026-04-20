import { type GovernorConfig, WorkspaceMode } from '@repo-ai-governor/config';
import {
  AdapterSurface,
  AdapterTransportKind,
  WorkspaceMigrationPolicy,
} from '@repo-ai-governor/shared';
import { CliUserConfigProjectionService } from '../../src/runtime/cli-user-config-projection-service.js';
import type { CliUserConfigService } from '../../src/runtime/cli-user-config-service.js';

describe('CliUserConfigProjectionService', () => {
  it('fills supported remote_api credential env defaults for model-only user-config entries', () => {
    const projectionService = new CliUserConfigProjectionService({
      userConfigService: {
        loadConfig: () => ({
          tools: {
            codex: {
              transport: AdapterTransportKind.REMOTE_API,
              remoteApi: {
                model: 'gpt-5-user-default',
              },
            },
          },
        }),
      } as unknown as CliUserConfigService,
    });
    const config: GovernorConfig = {
      schemaVersion: '1.1',
      workspace: {
        mode: WorkspaceMode.REPO_LOCAL,
        migrationPolicy: WorkspaceMigrationPolicy.COPY_VERIFY_SWITCH_ROLLBACK,
      },
      i18n: {
        runtimeEngine: 'i18next',
        defaultLocale: 'en-US',
        fallbackLocale: 'en-US',
        supportedLocales: ['en-US'],
      },
      adapters: {
        roles: [],
        routing: {
          roleBindings: {},
        },
        tools: [],
      },
    };

    const projectedConfig = projectionService.applyUserLocalDefaults({
      config,
      environment: {},
    });
    const codexTool = projectedConfig.adapters?.tools?.find(
      (tool) => tool.toolId === AdapterSurface.CODEX,
    );

    expect(codexTool?.transport).toBe(AdapterTransportKind.REMOTE_API);
    expect(codexTool?.remoteApi?.model).toBe('gpt-5-user-default');
    expect(codexTool?.remoteApi?.credentialEnvVar).toBe('OPENAI_API_KEY');
    expect(codexTool?.remoteApi?.provider).toBe('openai');
    expect(codexTool?.remoteApi?.vendorBinding).toBe('openai_responses');
  });
});
