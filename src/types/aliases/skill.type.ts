import type {
  SKILL_OPTIONAL_DIRECTORY_KEYS,
  SUPPORTED_SKILL_INSTALL_MODES,
  SUPPORTED_SKILL_SURFACES,
} from "../../constants/skill-package-layout.js";
import type { SUPPORTED_SKILL_SCOPES } from "../../constants/skill-runtime.js";
import type { SkillInstallTarget } from "../interfaces/skill-package-layout.interface.js";

export type SkillSurface = (typeof SUPPORTED_SKILL_SURFACES)[number];

export type SkillInstallMode = (typeof SUPPORTED_SKILL_INSTALL_MODES)[number];

export type SkillScope = (typeof SUPPORTED_SKILL_SCOPES)[number];

export type SkillOptionalDirectoryKey = (typeof SKILL_OPTIONAL_DIRECTORY_KEYS)[number];

export type SkillOptionalDirectoryPathKey = `${SkillOptionalDirectoryKey}Dir`;

export type SkillInstallTargets = Readonly<Record<SkillSurface, Readonly<SkillInstallTarget>>>;

export type SemverParsedVersion = [major: number, minor: number, patch: number];
