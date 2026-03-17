import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..", "..");

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function copySchemaFiles() {
  const sourceDirectory = path.join(ROOT_DIR, "src", "config", "schema");
  const targetDirectory = path.join(ROOT_DIR, "dist", "src", "config", "schema");

  ensureDirectory(targetDirectory);

  for (const fileName of fs.readdirSync(sourceDirectory)) {
    if (!fileName.endsWith(".json")) {
      continue;
    }

    fs.copyFileSync(path.join(sourceDirectory, fileName), path.join(targetDirectory, fileName));
  }
}

function copySkillsDirectory() {
  const sourceDirectory = path.join(ROOT_DIR, "skills");
  const targetDirectory = path.join(ROOT_DIR, "dist", "skills");

  ensureDirectory(path.dirname(targetDirectory));
  fs.cpSync(sourceDirectory, targetDirectory, { recursive: true });
}

function copyPackageManifest() {
  const sourceFilePath = path.join(ROOT_DIR, "package.json");
  const targetFilePath = path.join(ROOT_DIR, "dist", "package.json");

  ensureDirectory(path.dirname(targetFilePath));
  fs.copyFileSync(sourceFilePath, targetFilePath);
}

copySchemaFiles();
copySkillsDirectory();
copyPackageManifest();
