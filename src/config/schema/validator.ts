// @ts-nocheck
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { loadSchemaBundle } from "./index.js";
import { ConfigurationValidationError } from "../errors.js";
import { cloneValue } from "../../utils/common.js";

function buildValidationMessage(schemaName, errors) {
  const summary = errors
    .map((error) => {
      const instancePath = error.instancePath || "/";
      return `${instancePath} ${error.message ?? "is invalid"}`.trim();
    })
    .join("; ");

  return `Invalid ${schemaName} document: ${summary}`;
}

function createSchemaRegistry() {
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

export function getSchemaRegistry() {
  return schemaRegistry;
}

export function validateSchemaDocument(schemaName, document, options = {}) {
  const { bundle, ajv } = getSchemaRegistry();
  const schema = bundle[schemaName];

  if (!schema) {
    throw new TypeError(`Unknown schema name: ${schemaName}`);
  }

  const validate = ajv.getSchema(schema.$id);

  if (!validate) {
    throw new TypeError(`Schema has not been compiled: ${schemaName}`);
  }

  const candidate = options.clone === false ? document : cloneValue(document);
  const valid = validate(candidate);

  if (!valid) {
    throw new ConfigurationValidationError(
      buildValidationMessage(schemaName, validate.errors ?? []),
      {
        details: {
          schemaName,
          source: options.source,
          errors: validate.errors ?? [],
        },
      },
    );
  }

  return candidate;
}

export function buildDefaultGovernorConfig() {
  return validateSchemaDocument("governor", { schemaVersion: "1" }, { clone: false });
}
