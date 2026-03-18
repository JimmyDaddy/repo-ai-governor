import type { SCHEMA_FILE_NAMES } from "../../constants/schema-files.js";

export type SchemaName = keyof typeof SCHEMA_FILE_NAMES;

export type JsonSchemaDocument = Record<string, unknown> & { $id?: string };
