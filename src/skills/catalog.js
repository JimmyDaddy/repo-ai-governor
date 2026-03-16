import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ConfigError } from "../cli/runtime/errors.js";
import { validateSchemaDocument } from "../config/schema/validator.js";

function toCauseMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function toPackageRootFromCatalogPath(catalogPath) {
  return path.resolve(path.dirname(catalogPath), "..", "..");
}

function wrapValidationError(error, filePath, schemaName) {
  throw new ConfigError(`Failed to validate ${schemaName} document: ${filePath}`, {
    code: `cli.skills_invalid_${schemaName.replace(/\s+/g, "_")}`,
    details: {
      filePath,
      cause: toCauseMessage(error)
    }
  });
}

function readJsonFile(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new ConfigError(`Failed to read ${label}: ${filePath}`, {
      code: "cli.skills_read_failed",
      details: {
        filePath,
        label,
        cause: toCauseMessage(error)
      }
    });
  }
}

export function resolveBundledSkillCatalogPath() {
  return fileURLToPath(new URL("../../skills/official/catalog.json", import.meta.url));
}

export function loadSkillManifest(manifestPath) {
  const manifest = readJsonFile(manifestPath, "skill manifest");

  try {
    return validateSchemaDocument("skillManifest", manifest, {
      source: manifestPath
    });
  } catch (error) {
    wrapValidationError(error, manifestPath, "skill manifest");
  }
}

export function loadOfficialSkillCatalog(options = {}) {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const catalogPath = path.resolve(cwd, options.catalogPath ?? resolveBundledSkillCatalogPath());
  const catalogDocument = readJsonFile(catalogPath, "skill catalog");
  let catalog;

  try {
    catalog = validateSchemaDocument("skillCatalog", catalogDocument, {
      source: catalogPath
    });
  } catch (error) {
    wrapValidationError(error, catalogPath, "skill catalog");
  }

  const packageRoot = toPackageRootFromCatalogPath(catalogPath);
  const skills = catalog.skills.map((entry) => {
    const manifestPath = path.resolve(packageRoot, entry.manifestPath);
    const manifest = loadSkillManifest(manifestPath);

    return {
      ...entry,
      manifest,
      manifestPath,
      skillRoot: path.dirname(manifestPath),
      skillFilePath: path.resolve(path.dirname(manifestPath), manifest.entry.skillFile)
    };
  });

  return {
    cwd,
    catalogPath,
    packageRoot,
    catalog,
    skills
  };
}

