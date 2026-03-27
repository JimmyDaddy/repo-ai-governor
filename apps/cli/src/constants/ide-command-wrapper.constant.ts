import { ErrorOutputEnvironment } from '@repo-ai-governor/shared';
import type { IdeSurfaceContract } from '../types/interfaces/ide-command-wrapper.interface.js';
import { CliCommandName } from './cli-command.constant.js';
export {
  IDE_WRAPPER_DEFAULT_STANDARDS_SOURCE_IDS,
  IDE_WRAPPER_SELF_HOSTED_STANDARDS_SOURCE_REGISTRY,
  IdeStandardsSourceId,
  IdeStandardsSourceKind,
} from './ide-standards-source.constant.js';

/**
 * Defines supported IDE entry surfaces for command-wrapper metadata.
 */
export enum IdeEntrySurface {
  GENERIC_IDE = 'generic_ide',
  VSCODE = 'vscode',
  JETBRAINS = 'jetbrains',
  CURSOR = 'cursor',
  CLAUDE_CODE = 'claude_code',
  WEB_IDE = 'web_ide',
}

/**
 * Defines the shared capability set declared by IDE wrapper surface profiles.
 */
export enum IdeSurfaceCapability {
  COMMAND_WRAPPER = 'command_wrapper',
  STANDARDS_INJECTION = 'standards_injection',
  ENVIRONMENT_OVERLAY = 'environment_overlay',
  NEXT_ACTION_HINTS = 'next_action_hints',
}

/**
 * Defines degrade semantics when one surface cannot honor full wrapper behavior.
 */
export enum IdeSurfaceDegradeMode {
  PRESERVE_BASELINE = 'preserve_baseline',
  FALLBACK_TO_GENERIC_IDE = 'fallback_to_generic_ide',
}

/**
 * Defines shared environment keys injected by IDE command wrappers.
 */
export enum IdeWrapperEnvironmentKey {
  OUTPUT_MODE = 'REPO_AI_GOVERNOR_OUTPUT_MODE',
  ENTRY_SURFACE = 'REPO_AI_GOVERNOR_ENTRY_SURFACE',
  STANDARDS_PROFILE_ID = 'REPO_AI_GOVERNOR_STANDARDS_PROFILE_ID',
  STANDARDS_SOURCES = 'REPO_AI_GOVERNOR_STANDARDS_SOURCES',
}

/**
 * Defines reserved environment keys controlled by the wrapper itself.
 */
export const IDE_WRAPPER_RESERVED_ENVIRONMENT_KEYS = [
  IdeWrapperEnvironmentKey.OUTPUT_MODE,
  IdeWrapperEnvironmentKey.ENTRY_SURFACE,
  IdeWrapperEnvironmentKey.STANDARDS_PROFILE_ID,
  IdeWrapperEnvironmentKey.STANDARDS_SOURCES,
] as const;

/**
 * Defines canonical command set allowed by IDE wrapper baseline.
 */
export const IDE_WRAPPER_SUPPORTED_COMMANDS = [
  CliCommandName.INIT,
  CliCommandName.DOCTOR,
  CliCommandName.CHECK,
  CliCommandName.RUN,
  CliCommandName.REVIEW,
  CliCommandName.REVIEW_VERIFY,
  CliCommandName.PLAN,
  CliCommandName.UPGRADE,
] as const;

/**
 * Defines supported multi-entry surfaces exposed by the IDE wrapper contract.
 */
export const IDE_WRAPPER_SUPPORTED_SURFACES = [
  IdeEntrySurface.GENERIC_IDE,
  IdeEntrySurface.VSCODE,
  IdeEntrySurface.JETBRAINS,
  IdeEntrySurface.CURSOR,
  IdeEntrySurface.CLAUDE_CODE,
  IdeEntrySurface.WEB_IDE,
] as const;

/**
 * Defines default output mode for IDE-oriented command wrappers.
 */
export const IDE_WRAPPER_DEFAULT_OUTPUT_MODE = ErrorOutputEnvironment.JSON;

/**
 * Defines default standards profile id used for normative context injection.
 */
export const IDE_WRAPPER_DEFAULT_STANDARDS_PROFILE_ID = 'stage5-entry-baseline';

const IDE_SURFACE_BASELINE_CAPABILITIES = [
  IdeSurfaceCapability.COMMAND_WRAPPER,
  IdeSurfaceCapability.STANDARDS_INJECTION,
  IdeSurfaceCapability.ENVIRONMENT_OVERLAY,
  IdeSurfaceCapability.NEXT_ACTION_HINTS,
] as const;

/**
 * Declares per-surface contract metadata consumed by IDE wrapper runtime and tests.
 */
export const IDE_SURFACE_REGISTRY: readonly IdeSurfaceContract[] = [
  {
    surfaceId: IdeEntrySurface.GENERIC_IDE,
    displayName: 'Generic IDE',
    capabilities: [...IDE_SURFACE_BASELINE_CAPABILITIES],
    defaultOutputMode: IDE_WRAPPER_DEFAULT_OUTPUT_MODE,
    degradeMode: IdeSurfaceDegradeMode.PRESERVE_BASELINE,
    reservedEnvironmentKeys: [...IDE_WRAPPER_RESERVED_ENVIRONMENT_KEYS],
    nextAction:
      'Retry with the baseline IDE wrapper contract or inspect integrations/ide/contracts/command-wrapper.contract.json.',
  },
  {
    surfaceId: IdeEntrySurface.VSCODE,
    displayName: 'VS Code',
    capabilities: [...IDE_SURFACE_BASELINE_CAPABILITIES],
    defaultOutputMode: IDE_WRAPPER_DEFAULT_OUTPUT_MODE,
    degradeMode: IdeSurfaceDegradeMode.FALLBACK_TO_GENERIC_IDE,
    degradeTargetSurface: IdeEntrySurface.GENERIC_IDE,
    reservedEnvironmentKeys: [...IDE_WRAPPER_RESERVED_ENVIRONMENT_KEYS],
    nextAction:
      'Retry with VS Code task/env wiring or omit surface to fall back to the generic IDE contract.',
  },
  {
    surfaceId: IdeEntrySurface.JETBRAINS,
    displayName: 'JetBrains',
    capabilities: [...IDE_SURFACE_BASELINE_CAPABILITIES],
    defaultOutputMode: IDE_WRAPPER_DEFAULT_OUTPUT_MODE,
    degradeMode: IdeSurfaceDegradeMode.FALLBACK_TO_GENERIC_IDE,
    degradeTargetSurface: IdeEntrySurface.GENERIC_IDE,
    reservedEnvironmentKeys: [...IDE_WRAPPER_RESERVED_ENVIRONMENT_KEYS],
    nextAction:
      'Retry with the JetBrains external tool template or omit surface to fall back to the generic IDE contract.',
  },
  {
    surfaceId: IdeEntrySurface.CURSOR,
    displayName: 'Cursor',
    capabilities: [...IDE_SURFACE_BASELINE_CAPABILITIES],
    defaultOutputMode: IDE_WRAPPER_DEFAULT_OUTPUT_MODE,
    degradeMode: IdeSurfaceDegradeMode.FALLBACK_TO_GENERIC_IDE,
    degradeTargetSurface: IdeEntrySurface.GENERIC_IDE,
    reservedEnvironmentKeys: [...IDE_WRAPPER_RESERVED_ENVIRONMENT_KEYS],
    nextAction:
      'Retry with the Cursor wrapper template or omit surface to fall back to the generic IDE contract.',
  },
  {
    surfaceId: IdeEntrySurface.CLAUDE_CODE,
    displayName: 'Claude Code',
    capabilities: [...IDE_SURFACE_BASELINE_CAPABILITIES],
    defaultOutputMode: IDE_WRAPPER_DEFAULT_OUTPUT_MODE,
    degradeMode: IdeSurfaceDegradeMode.FALLBACK_TO_GENERIC_IDE,
    degradeTargetSurface: IdeEntrySurface.GENERIC_IDE,
    reservedEnvironmentKeys: [...IDE_WRAPPER_RESERVED_ENVIRONMENT_KEYS],
    nextAction:
      'Retry with the Claude Code wrapper template or omit surface to fall back to the generic IDE contract.',
  },
  {
    surfaceId: IdeEntrySurface.WEB_IDE,
    displayName: 'Web IDE',
    capabilities: [...IDE_SURFACE_BASELINE_CAPABILITIES],
    defaultOutputMode: IDE_WRAPPER_DEFAULT_OUTPUT_MODE,
    degradeMode: IdeSurfaceDegradeMode.FALLBACK_TO_GENERIC_IDE,
    degradeTargetSurface: IdeEntrySurface.GENERIC_IDE,
    reservedEnvironmentKeys: [...IDE_WRAPPER_RESERVED_ENVIRONMENT_KEYS],
    nextAction:
      'Retry with the web IDE bridge or omit surface to fall back to the generic IDE contract.',
  },
] as const;
