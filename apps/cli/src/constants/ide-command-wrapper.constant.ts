import { ErrorOutputEnvironment } from "@repo-ai-governor/shared";
import { CLI_COMMAND_NAMES } from "./cli-command.constant.js";

/**
 * Defines supported IDE entry surfaces for command-wrapper metadata.
 */
export enum IdeEntrySurface {
  GENERIC_IDE = "generic_ide",
  VSCODE = "vscode",
  JETBRAINS = "jetbrains",
  WEB_IDE = "web_ide",
}

/**
 * Defines shared environment keys injected by IDE command wrappers.
 */
export enum IdeWrapperEnvironmentKey {
  OUTPUT_MODE = "REPO_AI_GOVERNOR_OUTPUT_MODE",
  ENTRY_SURFACE = "REPO_AI_GOVERNOR_ENTRY_SURFACE",
  STANDARDS_PROFILE_ID = "REPO_AI_GOVERNOR_STANDARDS_PROFILE_ID",
  STANDARDS_SOURCES = "REPO_AI_GOVERNOR_STANDARDS_SOURCES",
}

/**
 * Defines canonical command set allowed by IDE wrapper baseline.
 */
export const IDE_WRAPPER_SUPPORTED_COMMANDS = [...CLI_COMMAND_NAMES] as const;

/**
 * Defines default output mode for IDE-oriented command wrappers.
 */
export const IDE_WRAPPER_DEFAULT_OUTPUT_MODE = ErrorOutputEnvironment.JSON;

/**
 * Defines default standards profile id used for normative context injection.
 */
export const IDE_WRAPPER_DEFAULT_STANDARDS_PROFILE_ID = "stage5-entry-baseline";

/**
 * Defines baseline standards sources injected for IDE and multi-entry surfaces.
 */
export const IDE_WRAPPER_DEFAULT_STANDARDS_SOURCES = [
  ".repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md",
  ".repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md",
  ".repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md",
  ".repo-ai-governor/normative_knowledge_sources/governance/code_standards.md",
  ".repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md",
  "AGENTS.md",
] as const;
