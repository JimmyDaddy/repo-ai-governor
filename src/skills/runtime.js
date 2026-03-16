import fs from "node:fs";
import path from "node:path";
import { DEFAULT_SKILL_INSTALL_TARGETS, SUPPORTED_SKILL_SURFACES } from "./package-layout.js";

export const SUPPORTED_SKILL_SCOPES = Object.freeze(["repo", "user"]);

function expandTargetPattern(targetPattern, env) {
  return targetPattern.replace(/\$([A-Z_]+)/g, (_match, variableName) => {
    const value = env[variableName];

    if (!value) {
      throw new TypeError(
        `Missing environment variable required for skill install target: ${variableName}`
      );
    }

    return value;
  });
}

export function validateSkillSurface(surface) {
  if (!SUPPORTED_SKILL_SURFACES.includes(surface)) {
    throw new TypeError(`Unsupported skill surface: ${surface}`);
  }

  return surface;
}

export function validateSkillScope(scope = "repo") {
  if (!SUPPORTED_SKILL_SCOPES.includes(scope)) {
    throw new TypeError(`Unsupported skill scope: ${scope}`);
  }

  return scope;
}

export function resolveSkillInstallTarget(options = {}) {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const env = options.env ?? process.env;
  const surface = validateSkillSurface(options.surface);
  const scope = validateSkillScope(options.scope ?? "repo");
  const installTarget = DEFAULT_SKILL_INSTALL_TARGETS[surface];

  if (options.targetPath) {
    return {
      surface,
      scope,
      mode: installTarget.mode,
      targetPath: path.resolve(cwd, options.targetPath),
      configuredPath: options.targetPath
    };
  }

  const configuredPath = scope === "repo" ? installTarget.repoLocal : installTarget.userLocal;
  const targetPath =
    scope === "repo"
      ? path.resolve(cwd, configuredPath)
      : path.resolve(expandTargetPattern(configuredPath, env));

  return {
    surface,
    scope,
    mode: installTarget.mode,
    targetPath,
    configuredPath
  };
}

export function listInstalledSkillRoots(targetPath) {
  if (!fs.existsSync(targetPath) || !fs.statSync(targetPath).isDirectory()) {
    return [];
  }

  return fs
    .readdirSync(targetPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.resolve(targetPath, entry.name))
    .sort((left, right) => left.localeCompare(right));
}
