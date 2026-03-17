import fs from "node:fs";
import { fileURLToPath } from "node:url";

export const CONFIG_SCHEMA_VERSION = "1";

export const SCHEMA_FILE_NAMES = Object.freeze({
  shared: "shared.schema.json",
  governor: "governor.schema.json",
  workflowTemplate: "workflow-template.schema.json",
  standardsPackage: "standards-package.schema.json",
  slot: "slot.schema.json",
  adapter: "adapter.schema.json",
  skillManifest: "skill-manifest.schema.json",
  skillCatalog: "skill-catalog.schema.json",
});

export type SchemaName = keyof typeof SCHEMA_FILE_NAMES;
export type JsonSchemaDocument = Record<string, unknown> & { $id?: string };

const schemaDirectoryUrl = new URL("./", import.meta.url);

export function resolveSchemaPath(schemaName: SchemaName): string {
  const fileName = SCHEMA_FILE_NAMES[schemaName];

  if (!fileName) {
    throw new TypeError(`Unknown schema name: ${schemaName}`);
  }

  return fileURLToPath(new URL(fileName, schemaDirectoryUrl));
}

export function loadJsonSchema(schemaName: SchemaName): JsonSchemaDocument {
  return JSON.parse(fs.readFileSync(resolveSchemaPath(schemaName), "utf8")) as JsonSchemaDocument;
}

export function loadSchemaBundle(): Record<SchemaName, JsonSchemaDocument> {
  const bundle = {} as Record<SchemaName, JsonSchemaDocument>;

  for (const schemaName of Object.keys(SCHEMA_FILE_NAMES) as SchemaName[]) {
    bundle[schemaName] = loadJsonSchema(schemaName);
  }

  return bundle;
}
