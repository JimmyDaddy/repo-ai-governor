export enum SkillSurfaceEnum {
  Codex = "codex",
  GitHubCopilot = "github-copilot",
  ClaudeCode = "claude-code",
}

export const SUPPORTED_SKILL_SURFACES = Object.freeze(
  Object.values(SkillSurfaceEnum),
) as readonly `${SkillSurfaceEnum}`[];

export enum SkillInstallModeEnum {
  Native = "native",
  Hybrid = "hybrid",
  Projection = "projection",
}

export const SUPPORTED_SKILL_INSTALL_MODES = Object.freeze(
  Object.values(SkillInstallModeEnum),
) as readonly `${SkillInstallModeEnum}`[];

export const SKILL_INSTALL_MODES = Object.freeze({
  native: SkillInstallModeEnum.Native,
  hybrid: SkillInstallModeEnum.Hybrid,
  projection: SkillInstallModeEnum.Projection,
} as const);

export enum SkillOptionalDirectoryKeyEnum {
  Agents = "agents",
  Scripts = "scripts",
  Templates = "templates",
  References = "references",
}

export const SKILL_OPTIONAL_DIRECTORY_KEYS = Object.freeze(
  Object.values(SkillOptionalDirectoryKeyEnum),
) as readonly `${SkillOptionalDirectoryKeyEnum}`[];
