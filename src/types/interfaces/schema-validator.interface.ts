import type { ValidateFunction } from "ajv";
import type { JsonSchemaDocument, SchemaName } from "../aliases/schema.type.js";

export interface ValidationOptions {
  clone?: boolean;
  source?: string;
}

export interface AjvLike {
  addSchema: (schema: unknown) => void;
  getSchema: <T>(schemaId: string) => ValidateFunction<T> | undefined;
}

export interface SchemaRegistry {
  ajv: AjvLike;
  bundle: Record<SchemaName, JsonSchemaDocument>;
}
