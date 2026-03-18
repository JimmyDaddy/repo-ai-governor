import type { SkillInstallMode, SkillInstallTargets } from "../aliases/skill.type.js";

export interface SkillInstallTarget {
  repoLocal: string;
  userLocal: string;
  mode: SkillInstallMode;
}

export interface RequiredRelativeLayout {
  bundledRoot: string;
  officialRoot: string;
  sharedRoot: string;
  catalogFile: string;
}

export interface SkillRelativeLayout extends RequiredRelativeLayout {
  skillRoot?: string;
  skillFile?: string;
  manifestFile?: string;
  agentsDir?: string;
  scriptsDir?: string;
  templatesDir?: string;
  referencesDir?: string;
}

export interface SkillAbsoluteLayout extends RequiredRelativeLayout {
  skillRoot?: string;
  skillFile?: string;
  manifestFile?: string;
  agentsDir?: string;
  scriptsDir?: string;
  templatesDir?: string;
  referencesDir?: string;
}

export interface ResolveSkillPackageLayoutOptions {
  cwd?: string;
  skillId?: string;
}

export interface ResolvedSkillPackageLayout {
  cwd: string;
  relative: SkillRelativeLayout;
  absolute: SkillAbsoluteLayout;
  installTargets: SkillInstallTargets;
}
