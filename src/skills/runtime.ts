import fs from "node:fs";
import path from "node:path";
import { SUPPORTED_SKILL_SCOPES, SkillScopeEnum } from "../constants/skill-runtime.js";
import type { SkillScope, SkillSurface } from "../types/aliases/skill.type.js";
import type {
  ResolveSkillInstallTargetOptions,
  ResolvedSkillInstallTarget,
} from "../types/interfaces/skill-runtime.interface.js";
import { DEFAULT_SKILL_INSTALL_TARGETS, SUPPORTED_SKILL_SURFACES } from "./package-layout.js";

export { SUPPORTED_SKILL_SCOPES };
export type { SkillScope } from "../types/aliases/skill.type.js";
export type {
  ResolveSkillInstallTargetOptions,
  ResolvedSkillInstallTarget,
} from "../types/interfaces/skill-runtime.interface.js";

function expandTargetPattern(targetPattern: string, env: NodeJS.ProcessEnv): string {
  return targetPattern.replace(/\$([A-Z_]+)/g, (_match, variableName) => {
    const value = env[variableName];

    if (!value) {
      throw new TypeError(
        `Missing environment variable required for skill install target: ${variableName}`,
      );
    }

    return value;
  });
}

export function validateSkillSurface(surface: unknown): SkillSurface {
  if (typeof surface !== "string" || !SUPPORTED_SKILL_SURFACES.includes(surface as SkillSurface)) {
    throw new TypeError(`Unsupported skill surface: ${surface}`);
  }

  return surface as SkillSurface;
}

export function validateSkillScope(scope: unknown = SkillScopeEnum.Repo): SkillScope {
  if (typeof scope !== "string" || !SUPPORTED_SKILL_SCOPES.includes(scope as SkillScope)) {
    throw new TypeError(`Unsupported skill scope: ${scope}`);
  }

  return scope as SkillScope;
}

export function resolveSkillInstallTarget(
  options: ResolveSkillInstallTargetOptions = {},
): ResolvedSkillInstallTarget {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const env = options.env ?? process.env;
  const surface = validateSkillSurface(options.surface);
  const scope = validateSkillScope(options.scope ?? SkillScopeEnum.Repo);
  const installTarget = DEFAULT_SKILL_INSTALL_TARGETS[surface];

  if (options.targetPath) {
    return {
      surface,
      scope,
      mode: installTarget.mode,
      targetPath: path.resolve(cwd, options.targetPath),
      configuredPath: options.targetPath,
    };
  }

  const configuredPath =
    scope === SkillScopeEnum.Repo ? installTarget.repoLocal : installTarget.userLocal;
  const targetPath =
    scope === SkillScopeEnum.Repo
      ? path.resolve(cwd, configuredPath)
      : path.resolve(expandTargetPattern(configuredPath, env));

  return {
    surface,
    scope,
    mode: installTarget.mode,
    targetPath,
    configuredPath,
  };
}

export function listInstalledSkillRoots(targetPath: string): string[] {
  if (!fs.existsSync(targetPath) || !fs.statSync(targetPath).isDirectory()) {
    return [];
  }

  return fs
    .readdirSync(targetPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.resolve(targetPath, entry.name))
    .sort((left, right) => left.localeCompare(right));
}
