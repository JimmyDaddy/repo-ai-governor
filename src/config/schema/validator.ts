import type { ErrorObject, ValidateFunction } from "ajv";
import addFormatsImport from "ajv-formats";
import Ajv2020Import from "ajv/dist/2020.js";
import { cloneValue } from "../../utils/common.js";
import { ConfigurationValidationError } from "../errors.js";
import { loadSchemaBundle } from "./index.js";
import type { JsonSchemaDocument, SchemaName } from "./index.js";

type ValidationOptions = {
  clone?: boolean;
  source?: string;
};

type AjvLike = {
  addSchema: (schema: unknown) => void;
  getSchema: <T>(schemaId: string) => ValidateFunction<T> | undefined;
};

type SchemaRegistry = {
  ajv: AjvLike;
  bundle: Record<SchemaName, JsonSchemaDocument>;
};

function buildValidationMessage(schemaName: SchemaName, errors: readonly ErrorObject[]): string {
  const summary = errors
    .map((error) => {
      const instancePath = error.instancePath || "/";
      return `${instancePath} ${error.message ?? "is invalid"}`.trim();
    })
    .join("; ");

  return `Invalid ${schemaName} document: ${summary}`;
}

function createSchemaRegistry(): SchemaRegistry {
  const Ajv2020 = Ajv2020Import as unknown as new (options: Record<string, unknown>) => AjvLike;
  const addFormats = addFormatsImport as unknown as (ajv: AjvLike) => void;

  const ajv = new Ajv2020({
    strict: false,
    allErrors: true,
    useDefaults: true,
  });

  addFormats(ajv);

  const bundle = loadSchemaBundle();

  for (const schema of Object.values(bundle)) {
    ajv.addSchema(schema);
  }

  return { ajv, bundle };
}

const schemaRegistry = createSchemaRegistry();

export function getSchemaRegistry(): SchemaRegistry {
  return schemaRegistry;
}

export function validateSchemaDocument<T>(
  schemaName: SchemaName,
  document: T,
  options: ValidationOptions = {},
): T {
  const { bundle, ajv } = getSchemaRegistry();
  const schema = bundle[schemaName];

  if (!schema) {
    throw new TypeError(`Unknown schema name: ${schemaName}`);
  }

  if (typeof schema.$id !== "string" || schema.$id.length === 0) {
    throw new TypeError(`Schema is missing a valid $id: ${schemaName}`);
  }

  const validate = ajv.getSchema(schema.$id) as ValidateFunction<T> | undefined;

  if (!validate) {
    throw new TypeError(`Schema has not been compiled: ${schemaName}`);
  }

  const candidate = options.clone === false ? document : cloneValue(document);
  const valid = validate(candidate);
  const errors = (validate.errors ?? []) as ErrorObject[];

  if (!valid) {
    throw new ConfigurationValidationError(buildValidationMessage(schemaName, errors), {
      details: {
        schemaName,
        source: options.source,
        errors,
      },
    });
  }

  return candidate;
}

export function buildDefaultGovernorConfig() {
  return validateSchemaDocument("governor", { schemaVersion: "1" }, { clone: false });
}
