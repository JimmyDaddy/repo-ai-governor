import path from "node:path";

export const SKILL_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SKILL_SEMVER_RANGE_PATTERN =
  /^(?:\^|~|>=|<=|>|<)?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

export const SUPPORTED_SKILL_SURFACES = Object.freeze([
  "codex",
  "github-copilot",
  "claude-code"
]);

export const SKILL_INSTALL_MODES = Object.freeze({
  native: "native",
  hybrid: "hybrid",
  projection: "projection"
});

export const DEFAULT_SKILL_INSTALL_TARGETS = Object.freeze({
  codex: Object.freeze({
    repoLocal: ".codex/skills",
    userLocal: "$CODEX_HOME/skills",
    mode: SKILL_INSTALL_MODES.native
  }),
  "github-copilot": Object.freeze({
    repoLocal: ".github/skills",
    userLocal: "$HOME/.copilot/skills",
    mode: SKILL_INSTALL_MODES.hybrid
  }),
  "claude-code": Object.freeze({
    repoLocal: ".claude/skills",
    userLocal: "$HOME/.claude/skills",
    mode: SKILL_INSTALL_MODES.native
  })
});

export const DEFAULT_SKILL_PACKAGE_LAYOUT = Object.freeze({
  bundledRoot: "skills",
  officialRoot: "skills/official",
  sharedRoot: "skills/shared",
  catalogFile: "skills/official/catalog.json",
  manifestFileName: "skill.json",
  requiredFiles: Object.freeze({
    skill: "SKILL.md",
    manifest: "skill.json"
  }),
  optionalDirectories: Object.freeze({
    agents: "agents",
    scripts: "scripts",
    templates: "templates",
    references: "references"
  }),
  installTargets: DEFAULT_SKILL_INSTALL_TARGETS
});

function joinRelativePath(...segments) {
  return segments.filter(Boolean).join("/");
}

function toAbsolutePath(cwd, relativePath) {
  return path.resolve(cwd, ...relativePath.split("/"));
}

function toKebabCase(value) {
  return String(value)
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function normalizeSkillId(value) {
  const skillId = toKebabCase(value);

  if (!SKILL_ID_PATTERN.test(skillId)) {
    throw new TypeError(`Skill ID does not match the required naming convention: ${value}`);
  }

  return skillId;
}

export function createSkillManifestFileName() {
  return DEFAULT_SKILL_PACKAGE_LAYOUT.manifestFileName;
}

export function resolveSkillPackageLayout(options = {}) {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const relative = {
    bundledRoot: DEFAULT_SKILL_PACKAGE_LAYOUT.bundledRoot,
    officialRoot: DEFAULT_SKILL_PACKAGE_LAYOUT.officialRoot,
    sharedRoot: DEFAULT_SKILL_PACKAGE_LAYOUT.sharedRoot,
    catalogFile: DEFAULT_SKILL_PACKAGE_LAYOUT.catalogFile
  };

  if (options.skillId) {
    const skillId = normalizeSkillId(options.skillId);
    relative.skillRoot = joinRelativePath(relative.officialRoot, skillId);
    relative.skillFile = joinRelativePath(
      relative.skillRoot,
      DEFAULT_SKILL_PACKAGE_LAYOUT.requiredFiles.skill
    );
    relative.manifestFile = joinRelativePath(
      relative.skillRoot,
      DEFAULT_SKILL_PACKAGE_LAYOUT.requiredFiles.manifest
    );

    for (const [key, directory] of Object.entries(DEFAULT_SKILL_PACKAGE_LAYOUT.optionalDirectories)) {
      relative[`${key}Dir`] = joinRelativePath(relative.skillRoot, directory);
    }
  }

  const absolute = Object.fromEntries(
    Object.entries(relative).map(([key, relativePath]) => [key, toAbsolutePath(cwd, relativePath)])
  );

  return {
    cwd,
    relative,
    absolute,
    installTargets: DEFAULT_SKILL_INSTALL_TARGETS
  };
}
