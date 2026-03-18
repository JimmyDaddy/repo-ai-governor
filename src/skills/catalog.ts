import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ConfigError } from "../cli/runtime/errors.js";
import { validateSchemaDocument } from "../config/schema/validator.js";
import type {
  OfficialSkillCatalogEntry,
  OfficialSkillCatalogState,
  SkillCatalog,
  SkillManifest,
} from "../types/interfaces/skill-catalog.interface.js";
export type {
  OfficialSkillCatalogEntry,
  OfficialSkillCatalogState,
} from "../types/interfaces/skill-catalog.interface.js";

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
