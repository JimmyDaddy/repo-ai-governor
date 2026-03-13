import { globalOptionDefinitions } from "../command-registry.js";

function compactOptions(options) {
  return Object.fromEntries(
    Object.entries(options).filter(([, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }

      return value !== undefined && value !== false;
    })
  );
}

export function createCommandContext(commandDefinition, parsedOptions, positionals) {
  const globalKeys = new Set(globalOptionDefinitions.map((definition) => definition.key));
  const commandKeys = new Set(commandDefinition.options.map((definition) => definition.key));
  const globalOptions = {};
  const commandOptions = {};

  for (const [key, value] of Object.entries(parsedOptions)) {
    if (commandKeys.has(key)) {
      commandOptions[key] = value;
      continue;
    }

    if (globalKeys.has(key)) {
      globalOptions[key] = value;
    }
  }

  const compactGlobalOptions = compactOptions(globalOptions);
  const compactCommandOptions = compactOptions(commandOptions);

  return {
    command: commandDefinition.name,
    globalOptions: compactGlobalOptions,
    commandOptions: compactCommandOptions,
    positionals,
    format: compactCommandOptions.format ?? compactGlobalOptions.format ?? "summary",
    quiet: compactGlobalOptions.quiet === true,
    verbose: compactGlobalOptions.verbose === true
  };
}
