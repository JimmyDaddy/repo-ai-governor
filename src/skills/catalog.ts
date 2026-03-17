import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ConfigError } from "../cli/runtime/errors.js";
import { validateSchemaDocument } from "../config/schema/validator.js";
import type { SkillInstallMode, SkillSurface } from "./package-layout.js";

type SkillManifestEntry = {
  skillFile: "SKILL.md";
  agentFiles: string[];
  scriptsDir: string;
  templatesDir: string;
  referencesDir: string;
};

type SkillManifest = {
  schemaVersion: "1";
  id: string;
  version: string;
  kind: "governor-skill";
  displayName: string;
  description: string;
  surfaces: SkillSurface[];
  entry: SkillManifestEntry;
  triggers: {
    keywords: string[];
    intents: string[];
  };
  compatibility: {
    repoAiGovernor: string;
    installModes: Partial<Record<SkillSurface, SkillInstallMode>>;
  };
  distribution: {
    channel: "official" | "project-local" | "team-shared";
    root: string;
  };
};

type SkillCatalogInstallTarget = {
  repoLocal: string;
  userLocal: string;
  mode: SkillInstallMode;
};

type SkillCatalogEntry = {
  id: string;
  manifestPath: string;
  surfaces: SkillSurface[];
  defaultInstallMode: SkillInstallMode;
};

type SkillCatalog = {
  schemaVersion: "1";
  id: "repo-ai-governor-official";
  version: string;
  kind: "skill-catalog";
  packageRoot: "skills";
  officialRoot: "skills/official";
  sharedRoot: "skills/shared";
  compatibility: {
    repoAiGovernor: string;
  };
  installTargets: Record<SkillSurface, SkillCatalogInstallTarget>;
  skills: SkillCatalogEntry[];
};

export type OfficialSkillCatalogEntry = SkillCatalogEntry & {
  manifest: SkillManifest;
  manifestPath: string;
  skillRoot: string;
  skillFilePath: string;
};

export type OfficialSkillCatalogState = {
  cwd: string;
  catalogPath: string;
  packageRoot: string;
  catalog: SkillCatalog;
  skills: OfficialSkillCatalogEntry[];
};

function toCauseMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function toPackageRootFromCatalogPath(catalogPath: string): string {
  return path.resolve(path.dirname(catalogPath), "..", "..");
}

function wrapValidationError(error: unknown, filePath: string, schemaName: string): never {
  throw new ConfigError(`Failed to validate ${schemaName} document: ${filePath}`, {
    code: `cli.skills_invalid_${schemaName.replace(/\s+/g, "_")}`,
    details: {
      filePath,
      cause: toCauseMessage(error),
    },
  });
}

function readJsonFile<T = unknown>(filePath: string, label: string): T {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch (error) {
    throw new ConfigError(`Failed to read ${label}: ${filePath}`, {
      code: "cli.skills_read_failed",
      details: {
        filePath,
        label,
        cause: toCauseMessage(error),
      },
    });
  }
}

export function resolveBundledSkillCatalogPath(): string {
  return fileURLToPath(new URL("../../skills/official/catalog.json", import.meta.url));
}

export function loadSkillManifest(manifestPath: string): SkillManifest {
  const manifest = readJsonFile<SkillManifest>(manifestPath, "skill manifest");

  try {
    return validateSchemaDocument("skillManifest", manifest, {
      source: manifestPath,
    }) as SkillManifest;
  } catch (error) {
    return wrapValidationError(error, manifestPath, "skill manifest");
  }
}

export function loadOfficialSkillCatalog(
  options: {
    cwd?: string;
    catalogPath?: string;
  } = {},
): OfficialSkillCatalogState {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const catalogPath = path.resolve(cwd, options.catalogPath ?? resolveBundledSkillCatalogPath());
  const catalogDocument = readJsonFile<SkillCatalog>(catalogPath, "skill catalog");
  let catalog: SkillCatalog;

  try {
    catalog = validateSchemaDocument("skillCatalog", catalogDocument, {
      source: catalogPath,
    }) as SkillCatalog;
  } catch (error) {
    return wrapValidationError(error, catalogPath, "skill catalog");
  }

  const packageRoot = toPackageRootFromCatalogPath(catalogPath);
  const skills = catalog.skills.map((entry): OfficialSkillCatalogEntry => {
    const manifestPath = path.resolve(packageRoot, entry.manifestPath);
    const manifest = loadSkillManifest(manifestPath);

    return {
      ...entry,
      manifest,
      manifestPath,
      skillRoot: path.dirname(manifestPath),
      skillFilePath: path.resolve(path.dirname(manifestPath), manifest.entry.skillFile),
    };
  });

  return {
    cwd,
    catalogPath,
    packageRoot,
    catalog,
    skills,
  };
}
