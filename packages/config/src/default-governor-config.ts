import {
  AdapterAvailability,
  AdapterSurface,
  DEFAULT_CLI_REACT_THEME_PRESET,
  DEFAULT_I18N_FALLBACK_LOCALE,
  DEFAULT_I18N_LOCALE,
  DEFAULT_MEMORY_RUNTIME_CONFIG,
  DefaultRoleProfileId,
  WorkspaceMigrationPolicy,
} from '@repo-ai-governor/shared';
import type {
  AdaptersConfig,
  GovernorConfig,
  MemoryConfig,
  WorkspaceConfig,
} from './types/interfaces/index.js';

const STRUCTURED_OUTPUT_CAPABILITY = 'structured_output';
const TOOL_CALLING_CAPABILITY = 'tool_calling';

/**
 * Builds the canonical default adapters baseline shared by CLI bootstrap, init, and self-host
 * adoption flows.
 *
 * Why this exists:
 * the repository previously duplicated this finite routing/tool matrix across multiple runtime
 * entrypoints, which made repo-local self-host bootstrap drift from the active CLI default.
 *
 * @returns Deep-cloned adapters config baseline.
 */
export function buildDefaultAdaptersConfig(): AdaptersConfig {
  return {
    roles: [
      {
        roleId: 'planner',
        roleProfileId: DefaultRoleProfileId.PLANNER,
        requiredCapabilities: [STRUCTURED_OUTPUT_CAPABILITY],
        required: true,
      },
      {
        roleId: 'architect',
        roleProfileId: DefaultRoleProfileId.ARCHITECT,
        requiredCapabilities: [STRUCTURED_OUTPUT_CAPABILITY],
        required: true,
      },
      {
        roleId: 'coder',
        roleProfileId: DefaultRoleProfileId.CODER,
        requiredCapabilities: [TOOL_CALLING_CAPABILITY],
        required: true,
      },
      {
        roleId: 'tester',
        roleProfileId: DefaultRoleProfileId.TESTER,
        requiredCapabilities: [TOOL_CALLING_CAPABILITY],
        required: true,
      },
      {
        roleId: 'reviewer',
        roleProfileId: DefaultRoleProfileId.REVIEWER,
        requiredCapabilities: [STRUCTURED_OUTPUT_CAPABILITY],
        required: true,
      },
      {
        roleId: 'verifier',
        roleProfileId: DefaultRoleProfileId.VERIFIER,
        requiredCapabilities: [STRUCTURED_OUTPUT_CAPABILITY],
        required: true,
      },
    ],
    routing: {
      roleBindings: {
        planner: {
          primarySurface: AdapterSurface.CODEX,
          fallbackSurfaces: [AdapterSurface.CLAUDE_CODE, AdapterSurface.GITHUB_COPILOT],
        },
        architect: {
          primarySurface: AdapterSurface.CODEX,
          fallbackSurfaces: [AdapterSurface.CLAUDE_CODE, AdapterSurface.GITHUB_COPILOT],
        },
        coder: {
          primarySurface: AdapterSurface.CODEX,
          fallbackSurfaces: [AdapterSurface.GITHUB_COPILOT, AdapterSurface.CLAUDE_CODE],
        },
        tester: {
          primarySurface: AdapterSurface.GITHUB_COPILOT,
          fallbackSurfaces: [AdapterSurface.CODEX, AdapterSurface.CLAUDE_CODE],
        },
        reviewer: {
          primarySurface: AdapterSurface.CLAUDE_CODE,
          fallbackSurfaces: [AdapterSurface.CODEX, AdapterSurface.GITHUB_COPILOT],
        },
        verifier: {
          primarySurface: AdapterSurface.CODEX,
          fallbackSurfaces: [AdapterSurface.CLAUDE_CODE, AdapterSurface.GITHUB_COPILOT],
        },
      },
    },
    tools: [
      {
        toolId: AdapterSurface.CODEX,
        enabled: true,
        availability: AdapterAvailability.AVAILABLE,
      },
      {
        toolId: AdapterSurface.GITHUB_COPILOT,
        enabled: true,
        availability: AdapterAvailability.AVAILABLE,
      },
      {
        toolId: AdapterSurface.CLAUDE_CODE,
        enabled: true,
        availability: AdapterAvailability.AVAILABLE,
      },
    ],
  };
}

/**
 * Renders one stable default governor config document while allowing runtime callers to override
 * workspace mode and memory store root.
 *
 * @param workspace Workspace baseline fields, typically mode plus optional migration policy.
 * @param memoryConfig Memory baseline fields; defaults to the shared runtime baseline.
 * @returns Stable governor config object ready for YAML rendering or runtime fallback use.
 */
export function buildDefaultGovernorConfig(
  workspace: Pick<WorkspaceConfig, 'mode'> & Partial<WorkspaceConfig>,
  memoryConfig: Partial<MemoryConfig> = {},
): GovernorConfig {
  return {
    schemaVersion: '1.1',
    workspace: {
      mode: workspace.mode,
      migrationPolicy:
        workspace.migrationPolicy ?? WorkspaceMigrationPolicy.COPY_VERIFY_SWITCH_ROLLBACK,
      ...(workspace.toolManagedRoot
        ? {
            toolManagedRoot: workspace.toolManagedRoot,
          }
        : {}),
      ...(workspace.repoLocalRoot
        ? {
            repoLocalRoot: workspace.repoLocalRoot,
          }
        : {}),
    },
    i18n: {
      runtimeEngine: 'i18next',
      defaultLocale: DEFAULT_I18N_LOCALE,
      fallbackLocale: DEFAULT_I18N_FALLBACK_LOCALE,
      supportedLocales: [DEFAULT_I18N_LOCALE, DEFAULT_I18N_FALLBACK_LOCALE],
    },
    memory: {
      storeEngine: memoryConfig.storeEngine ?? DEFAULT_MEMORY_RUNTIME_CONFIG.storeEngine,
      storeRoot: memoryConfig.storeRoot ?? DEFAULT_MEMORY_RUNTIME_CONFIG.storeRoot,
    },
    ui: {
      react: {
        theme: DEFAULT_CLI_REACT_THEME_PRESET,
      },
    },
    adapters: buildDefaultAdaptersConfig(),
  };
}

/**
 * Renders one stable governor config YAML document from the structured config object.
 *
 * Why this exists:
 * CLI init/bootstrap/self-host install all need byte-stable config seeding, so YAML rendering
 * should not drift across entrypoints.
 *
 * @param config Structured governor config object.
 * @returns UTF-8 YAML content with trailing newline.
 */
export function renderGovernorConfigContent(config: GovernorConfig): string {
  const roleLines = (config.adapters?.roles ?? []).flatMap((role) => [
    `    - roleId: ${role.roleId}`,
    `      roleProfileId: ${role.roleProfileId}`,
    '      requiredCapabilities:',
    ...role.requiredCapabilities.map((capability) => `        - ${capability}`),
    `      required: ${role.required ? 'true' : 'false'}`,
  ]);
  const roleBindingLines = Object.entries(config.adapters?.routing.roleBindings ?? {}).flatMap(
    ([roleId, binding]) => [
      `      ${roleId}:`,
      `        primarySurface: ${binding.primarySurface}`,
      ...(binding.fallbackSurfaces && binding.fallbackSurfaces.length > 0
        ? [
            '        fallbackSurfaces:',
            ...binding.fallbackSurfaces.map((surface) => `          - ${surface}`),
          ]
        : []),
    ],
  );
  const toolLines = (config.adapters?.tools ?? []).flatMap((tool) => [
    `    - toolId: ${tool.toolId}`,
    `      enabled: ${tool.enabled === false ? 'false' : 'true'}`,
    ...(tool.availability ? [`      availability: ${tool.availability}`] : []),
  ]);

  return [
    `schemaVersion: "${config.schemaVersion}"`,
    'workspace:',
    `  mode: ${config.workspace.mode}`,
    `  migrationPolicy: ${config.workspace.migrationPolicy}`,
    'i18n:',
    `  runtimeEngine: ${config.i18n.runtimeEngine}`,
    `  defaultLocale: ${config.i18n.defaultLocale}`,
    `  fallbackLocale: ${config.i18n.fallbackLocale}`,
    '  supportedLocales:',
    ...(config.i18n.supportedLocales ?? []).map((locale) => `    - ${locale}`),
    'ui:',
    '  react:',
    `    theme: ${config.ui?.react?.theme ?? DEFAULT_CLI_REACT_THEME_PRESET}`,
    'memory:',
    `  storeEngine: ${config.memory?.storeEngine ?? DEFAULT_MEMORY_RUNTIME_CONFIG.storeEngine}`,
    `  storeRoot: ${config.memory?.storeRoot ?? DEFAULT_MEMORY_RUNTIME_CONFIG.storeRoot}`,
    'adapters:',
    '  roles:',
    ...roleLines,
    '  routing:',
    '    roleBindings:',
    ...roleBindingLines,
    '  tools:',
    ...toolLines,
    '',
  ].join('\n');
}
