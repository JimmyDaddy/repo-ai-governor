import fs from "node:fs";
import { fileURLToPath } from "node:url";

export const CONFIG_SCHEMA_VERSION = "1";

export const SCHEMA_FILE_NAMES = Object.freeze({
  shared: "shared.schema.json",
  governor: "governor.schema.json",
  workflowTemplate: "workflow-template.schema.json",
  slot: "slot.schema.json",
  adapter: "adapter.schema.json"
});

const schemaDirectoryUrl = new URL("./", import.meta.url);

export function resolveSchemaPath(schemaName) {
  const fileName = SCHEMA_FILE_NAMES[schemaName];

  if (!fileName) {
    throw new TypeError(`Unknown schema name: ${schemaName}`);
  }

  return fileURLToPath(new URL(fileName, schemaDirectoryUrl));
}

export function loadJsonSchema(schemaName) {
  return JSON.parse(fs.readFileSync(resolveSchemaPath(schemaName), "utf8"));
}

export function loadSchemaBundle() {
  return Object.fromEntries(
    Object.keys(SCHEMA_FILE_NAMES).map((schemaName) => [schemaName, loadJsonSchema(schemaName)])
  );
}
