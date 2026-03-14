import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import {
  ConfigurationConflictError,
  ConfigurationError,
  ConfigurationFileError
} from "./errors.js";
import { resolveRepositoryLayout } from "./repository-layout.js";
import { buildDefaultGovernorConfig, validateSchemaDocument } from "./schema/validator.js";
import { validateSlotDefinition } from "../slots/slot-model.js";

export const CONFIG_ENV_PREFIX = "REPO_AI_GOVERNOR__";

const YAML_FILE_PATTERN = /\.ya?ml$/i;

function cloneValue(value) {
  return structuredClone(value);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function toCamelCase(segment) {
  return String(segment)
    .trim()
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part, index) => (index === 0 ? part : `${part[0].toUpperCase()}${part.slice(1)}`))
    .join("");
}

function setDeepValue(target, pathSegments, value) {
  let cursor = target;

  for (let index = 0; index < pathSegments.length; index += 1) {
    const segment = pathSegments[index];
    const isLeaf = index === pathSegments.length - 1;

    if (isLeaf) {
      cursor[segment] = value;
      return;
    }

    if (!isPlainObject(cursor[segment])) {
      cursor[segment] = {};
    }

    cursor = cursor[segment];
  }
}

function parseScalarValue(rawValue) {
  const value = String(rawValue).trim();

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  if (value === "null") {
    return null;
  }

  if (value !== "" && !Number.isNaN(Number(value))) {
    return Number(value);
  }

  if ((value.startsWith("[") && value.endsWith("]")) || (value.startsWith("{") && value.endsWith("}"))) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value;
}

function readYamlDocument(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const parsed = YAML.parse(content);

    if (!isPlainObject(parsed)) {
      throw new ConfigurationFileError(`YAML document must be an object: ${filePath}`, {
        details: {
          filePath
        }
      });
    }

    return parsed;
  } catch (error) {
    if (error instanceof ConfigurationFileError) {
      throw error;
    }

    throw new ConfigurationFileError(`Failed to read YAML config: ${filePath}`, {
      details: {
        filePath,
        cause: error instanceof Error ? error.message : String(error)
      }
    });
  }
}

function mergeLayer(baseValue, incomingValue, context) {
  if (incomingValue === undefined) {
    return cloneValue(baseValue);
  }

  if (baseValue === undefined) {
    return cloneValue(incomingValue);
  }

  if (Array.isArray(baseValue) && Array.isArray(incomingValue)) {
    return cloneValue(incomingValue);
  }

  if (isPlainObject(baseValue) && isPlainObject(incomingValue)) {
    const result = {};
    const keys = new Set([...Object.keys(baseValue), ...Object.keys(incomingValue)]);

    for (const key of keys) {
      const pathSegments = [...context.path, key];

      if (!(key in incomingValue)) {
        result[key] = cloneValue(baseValue[key]);
        continue;
      }

      if (!(key in baseValue)) {
        result[key] = cloneValue(incomingValue[key]);
        continue;
      }

      result[key] = mergeLayer(baseValue[key], incomingValue[key], {
        ...context,
        path: pathSegments
      });
    }

    return result;
  }

  if (isPlainObject(baseValue) !== isPlainObject(incomingValue) || Array.isArray(baseValue) !== Array.isArray(incomingValue)) {
    throw new ConfigurationConflictError(`Configuration type conflict at ${context.path.join(".")}`, {
      details: {
        path: context.path,
        baseLayer: context.baseLayer,
        incomingLayer: context.incomingLayer,
        baseType: Array.isArray(baseValue) ? "array" : typeof baseValue,
        incomingType: Array.isArray(incomingValue) ? "array" : typeof incomingValue
      }
    });
  }

  return cloneValue(incomingValue);
}

function mergeConfigLayers(layers) {
  return layers.reduce((current, layer) => {
    if (!layer.value || (isPlainObject(layer.value) && Object.keys(layer.value).length === 0)) {
      return current;
    }

    return mergeLayer(current, layer.value, {
      path: [],
      baseLayer: layer.previousLayerName,
      incomingLayer: layer.name
    });
  }, {});
}

function resolveConfigFilePath(cwd, configPath) {
  if (configPath) {
    return path.resolve(cwd, configPath);
  }

  const layout = resolveRepositoryLayout({ cwd });
  return layout.absolute.configFile;
}

function loadGovernorFile(cwd, configPath, options = {}) {
  const filePath = resolveConfigFilePath(cwd, configPath);
  const exists = fs.existsSync(filePath);

  if (!exists) {
    if (options.requireConfigFile) {
      throw new ConfigurationFileError(`Main config file not found: ${filePath}`, {
        details: {
          filePath
        }
      });
    }

    return {
      filePath,
      exists: false,
      config: {}
    };
  }

  const document = readYamlDocument(filePath);
  const config = validateSchemaDocument("governor", document, {
    source: filePath
  });

  return {
    filePath,
    exists: true,
    config
  };
}

function listYamlFiles(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    return [];
  }

  const stat = fs.statSync(directoryPath);

  if (!stat.isDirectory()) {
    throw new ConfigurationFileError(`Config directory is not a directory: ${directoryPath}`, {
      details: {
        directoryPath
      }
    });
  }

  return fs
    .readdirSync(directoryPath)
    .filter((entry) => YAML_FILE_PATTERN.test(entry))
    .sort()
    .map((entry) => path.join(directoryPath, entry));
}

function loadDefinitionDirectory(cwd, relativeDirectoryPath, schemaName, kind) {
  const directoryPath = path.resolve(cwd, relativeDirectoryPath);
  const filePaths = listYamlFiles(directoryPath);
  const definitions = [];
  const seenIds = new Map();

  for (const filePath of filePaths) {
    const document = readYamlDocument(filePath);
    const config =
      schemaName === "slot"
        ? validateSlotDefinition(document)
        : validateSchemaDocument(schemaName, document, {
            source: filePath
          });

    if (seenIds.has(config.id)) {
      throw new ConfigurationConflictError(`Duplicate ${kind} id "${config.id}"`, {
        details: {
          kind,
          id: config.id,
          filePath,
          previousFilePath: seenIds.get(config.id)
        }
      });
    }

    seenIds.set(config.id, filePath);
    definitions.push({
      id: config.id,
      filePath,
      config
    });
  }

  return {
    directoryPath,
    files: filePaths,
    definitions
  };
}

function buildEnvironmentOverride(environment = process.env) {
  const override = {};
  const relevantEntries = Object.entries(environment)
    .filter(([key]) => key.startsWith(CONFIG_ENV_PREFIX))
    .sort(([left], [right]) => left.localeCompare(right));

  for (const [key, value] of relevantEntries) {
    const pathSegments = key
      .slice(CONFIG_ENV_PREFIX.length)
      .split("__")
      .filter(Boolean)
      .map(toCamelCase);

    if (pathSegments.length === 0) {
      continue;
    }

    setDeepValue(override, pathSegments, parseScalarValue(value));
  }

  return override;
}

export function buildCliConfigOverride(cliOptions = {}) {
  const override = {};

  if (cliOptions.project) {
    setDeepValue(override, ["execution", "currentProject"], cliOptions.project);
  }

  if (cliOptions.sprint) {
    setDeepValue(override, ["execution", "currentSprint"], cliOptions.sprint);
  }

  if (cliOptions.locale) {
    setDeepValue(override, ["standards", "locales", "default"], cliOptions.locale);
  }

  if (cliOptions.language) {
    setDeepValue(override, ["project", "language"], cliOptions.language);
  }

  if (cliOptions.preset) {
    setDeepValue(override, ["standards", "preset"], cliOptions.preset);
  }

  if (cliOptions.adapter) {
    const adapters = Array.isArray(cliOptions.adapter) ? cliOptions.adapter : [cliOptions.adapter];
    setDeepValue(override, ["adapters", "enabled"], [...new Set(adapters)]);
  }

  return override;
}

function ensureEnabledDefinitionsExist(config, definitions, sectionName) {
  const enabledIds = config?.[sectionName]?.enabled ?? [];

  if (!Array.isArray(enabledIds) || enabledIds.length === 0) {
    return;
  }

  const knownIds = new Set(definitions.map((definition) => definition.id));

  for (const id of enabledIds) {
    if (!knownIds.has(id)) {
      throw new ConfigurationError(`Enabled ${sectionName.slice(0, -1)} definition is missing: ${id}`, {
        code: "config.missing_enabled_definition",
        details: {
          sectionName,
          id
        }
      });
    }
  }
}

export function loadResolvedConfig(options = {}) {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const defaultConfig = buildDefaultGovernorConfig();
  const governorFile = loadGovernorFile(cwd, options.configPath, {
    requireConfigFile: options.requireConfigFile ?? false
  });
  const environmentOverride = buildEnvironmentOverride(options.environment ?? process.env);
  const cliOverride = buildCliConfigOverride(options.cliOverrides ?? {});
  const mergedForDiscovery = validateSchemaDocument(
    "governor",
    mergeConfigLayers([
      {
        name: "defaults",
        previousLayerName: "defaults",
        value: defaultConfig
      },
      {
        name: "repository",
        previousLayerName: "defaults",
        value: governorFile.config
      },
      {
        name: "environment",
        previousLayerName: "repository",
        value: environmentOverride
      },
      {
        name: "cli",
        previousLayerName: "environment",
        value: cliOverride
      }
    ]),
    {
      source: governorFile.filePath
    }
  );

  const loadedSlots = loadDefinitionDirectory(
    cwd,
    mergedForDiscovery.slots.directory,
    "slot",
    "slot"
  );
  const loadedAdapters = loadDefinitionDirectory(
    cwd,
    mergedForDiscovery.adapters.directory,
    "adapter",
    "adapter"
  );

  const resolvedConfig = validateSchemaDocument(
    "governor",
    mergeConfigLayers([
      {
        name: "defaults",
        previousLayerName: "defaults",
        value: defaultConfig
      },
      {
        name: "repository",
        previousLayerName: "defaults",
        value: governorFile.config
      },
      {
        name: "environment",
        previousLayerName: "repository",
        value: environmentOverride
      },
      {
        name: "cli",
        previousLayerName: "environment",
        value: cliOverride
      }
    ]),
    {
      source: governorFile.filePath
    }
  );

  if (!options.skipEnabledDefinitionCheck) {
    ensureEnabledDefinitionsExist(resolvedConfig, loadedSlots.definitions, "slots");
    ensureEnabledDefinitionsExist(resolvedConfig, loadedAdapters.definitions, "adapters");
  }

  return {
    cwd,
    config: resolvedConfig,
    slotDefinitions: loadedSlots.definitions,
    adapterDefinitions: loadedAdapters.definitions,
    layers: [
      {
        name: "defaults",
        source: "built-in schema defaults"
      },
      {
        name: "repository",
        source: governorFile.exists ? governorFile.filePath : "not-found"
      },
      {
        name: "slots",
        source: loadedSlots.directoryPath
      },
      {
        name: "adapters",
        source: loadedAdapters.directoryPath
      },
      {
        name: "environment",
        source: CONFIG_ENV_PREFIX
      },
      {
        name: "cli",
        source: "cli overrides"
      }
    ],
    paths: {
      configFile: governorFile.filePath,
      slotsDirectory: loadedSlots.directoryPath,
      adaptersDirectory: loadedAdapters.directoryPath
    }
  };
}
