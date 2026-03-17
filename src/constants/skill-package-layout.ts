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

export const SKILL_INSTALL_MODES = Object.freeze({
  native: SkillInstallModeEnum.Native,
  hybrid: SkillInstallModeEnum.Hybrid,
  projection: SkillInstallModeEnum.Projection,
} as const);
