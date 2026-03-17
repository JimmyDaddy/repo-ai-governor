import path from "node:path";

export const SKILL_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SKILL_SEMVER_RANGE_PATTERN = /^(?:\^|~|>=|<=|>|<)?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

export const SUPPORTED_SKILL_SURFACES = Object.freeze([
  "codex",
  "github-copilot",
  "claude-code",
] as const);

export type SkillSurface = (typeof SUPPORTED_SKILL_SURFACES)[number];

export const SKILL_INSTALL_MODES = Object.freeze({
  native: "native",
  hybrid: "hybrid",
  projection: "projection",
} as const);

export type SkillInstallMode = (typeof SKILL_INSTALL_MODES)[keyof typeof SKILL_INSTALL_MODES];

export type SkillInstallTarget = {
  repoLocal: string;
  userLocal: string;
  mode: SkillInstallMode;
};

export type SkillInstallTargets = Readonly<Record<SkillSurface, Readonly<SkillInstallTarget>>>;

export const DEFAULT_SKILL_INSTALL_TARGETS: SkillInstallTargets = Object.freeze({
  codex: Object.freeze({
    repoLocal: ".codex/skills",
    userLocal: "$CODEX_HOME/skills",
    mode: SKILL_INSTALL_MODES.native,
  }),
  "github-copilot": Object.freeze({
    repoLocal: ".github/skills",
    userLocal: "$HOME/.copilot/skills",
    mode: SKILL_INSTALL_MODES.hybrid,
  }),
  "claude-code": Object.freeze({
    repoLocal: ".claude/skills",
    userLocal: "$HOME/.claude/skills",
    mode: SKILL_INSTALL_MODES.native,
  }),
});

type OptionalDirectoryKey = "agents" | "scripts" | "templates" | "references";
type OptionalDirectoryPathKey = `${OptionalDirectoryKey}Dir`;

type RequiredRelativeLayout = {
  bundledRoot: string;
  officialRoot: string;
  sharedRoot: string;
  catalogFile: string;
};

type SkillRelativeLayout = RequiredRelativeLayout &
  Partial<
    {
      skillRoot: string;
      skillFile: string;
      manifestFile: string;
    } & Record<OptionalDirectoryPathKey, string>
  >;

type SkillAbsoluteLayout = {
  [K in keyof SkillRelativeLayout]: string;
};

export type ResolveSkillPackageLayoutOptions = {
  cwd?: string;
  skillId?: string;
};

export type ResolvedSkillPackageLayout = {
  cwd: string;
  relative: SkillRelativeLayout;
  absolute: SkillAbsoluteLayout;
  installTargets: SkillInstallTargets;
};

export const DEFAULT_SKILL_PACKAGE_LAYOUT = Object.freeze({
  bundledRoot: "skills",
  officialRoot: "skills/official",
  sharedRoot: "skills/shared",
  catalogFile: "skills/official/catalog.json",
  manifestFileName: "skill.json",
  requiredFiles: Object.freeze({
    skill: "SKILL.md",
    manifest: "skill.json",
  }),
  optionalDirectories: Object.freeze({
    agents: "agents",
    scripts: "scripts",
    templates: "templates",
    references: "references",
  }),
  installTargets: DEFAULT_SKILL_INSTALL_TARGETS,
});

function joinRelativePath(...segments: Array<string | null | undefined>): string {
  return segments.filter((segment): segment is string => Boolean(segment)).join("/");
}

function toAbsolutePath(cwd: string, relativePath: string): string {
  return path.resolve(cwd, ...relativePath.split("/"));
}

function toKebabCase(value: unknown): string {
  return String(value)
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function normalizeSkillId(value: unknown): string {
  const skillId = toKebabCase(value);

  if (!SKILL_ID_PATTERN.test(skillId)) {
    throw new TypeError(`Skill ID does not match the required naming convention: ${value}`);
  }

  return skillId;
}

export function createSkillManifestFileName(): string {
  return DEFAULT_SKILL_PACKAGE_LAYOUT.manifestFileName;
}

export function resolveSkillPackageLayout(
  options: ResolveSkillPackageLayoutOptions = {},
): ResolvedSkillPackageLayout {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const relative: SkillRelativeLayout = {
    bundledRoot: DEFAULT_SKILL_PACKAGE_LAYOUT.bundledRoot,
    officialRoot: DEFAULT_SKILL_PACKAGE_LAYOUT.officialRoot,
    sharedRoot: DEFAULT_SKILL_PACKAGE_LAYOUT.sharedRoot,
    catalogFile: DEFAULT_SKILL_PACKAGE_LAYOUT.catalogFile,
  };

  if (options.skillId) {
    const skillId = normalizeSkillId(options.skillId);
    const skillRoot = joinRelativePath(relative.officialRoot, skillId);

    relative.skillRoot = skillRoot;
    relative.skillFile = joinRelativePath(
      skillRoot,
      DEFAULT_SKILL_PACKAGE_LAYOUT.requiredFiles.skill,
    );
    relative.manifestFile = joinRelativePath(
      skillRoot,
      DEFAULT_SKILL_PACKAGE_LAYOUT.requiredFiles.manifest,
    );

    for (const key of Object.keys(
      DEFAULT_SKILL_PACKAGE_LAYOUT.optionalDirectories,
    ) as OptionalDirectoryKey[]) {
      const directory = DEFAULT_SKILL_PACKAGE_LAYOUT.optionalDirectories[key];
      const relativeKey = `${key}Dir` as OptionalDirectoryPathKey;
      relative[relativeKey] = joinRelativePath(skillRoot, directory);
    }
  }

  const absolute = Object.fromEntries(
    Object.entries(relative).map(([key, relativePath]) => [key, toAbsolutePath(cwd, relativePath)]),
  ) as SkillAbsoluteLayout;

  return {
    cwd,
    relative,
    absolute,
    installTargets: DEFAULT_SKILL_INSTALL_TARGETS,
  };
}
