import type { ParsedOptions } from "../../types/aliases/cli.type.js";
import type { CommandDefinition } from "../../types/interfaces/cli-command-registry.interface.js";
import type { CommandContext } from "../../types/interfaces/cli-runtime.interface.js";
import { globalOptionDefinitions } from "../command-registry.js";

function compactOptions(options: ParsedOptions): ParsedOptions {
  return Object.fromEntries(
    Object.entries(options).filter(([, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }

      return value !== undefined && value !== false;
    }),
  );
}

export function createCommandContext(
  commandDefinition: CommandDefinition,
  parsedOptions: ParsedOptions,
  positionals: string[],
): CommandContext {
  const globalKeys = new Set(globalOptionDefinitions.map((definition) => definition.key));
  const commandKeys = new Set(commandDefinition.options.map((definition) => definition.key));
  const globalOptions: ParsedOptions = {};
  const commandOptions: ParsedOptions = {};

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
  const commandFormat =
    typeof compactCommandOptions.format === "string" ? compactCommandOptions.format : undefined;
  const globalFormat =
    typeof compactGlobalOptions.format === "string" ? compactGlobalOptions.format : undefined;

  return {
    command: commandDefinition.name,
    globalOptions: compactGlobalOptions,
    commandOptions: compactCommandOptions,
    positionals,
    format: commandFormat ?? globalFormat ?? "summary",
    quiet: compactGlobalOptions.quiet === true,
    verbose: compactGlobalOptions.verbose === true,
  };
}
