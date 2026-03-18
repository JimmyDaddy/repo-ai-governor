import type { SkillInstallMode, SkillScope, SkillSurface } from "../aliases/skill.type.js";

export interface ResolveSkillInstallTargetOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  surface?: string;
  scope?: string;
  targetPath?: string;
}

export interface ResolvedSkillInstallTarget {
  surface: SkillSurface;
  scope: SkillScope;
  mode: SkillInstallMode;
  targetPath: string;
  configuredPath: string;
}
