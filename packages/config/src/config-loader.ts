import { readFileSync } from "node:fs";

import { parse } from "yaml";

import { ConfigError, GovernorErrorCode } from "../../shared/src/errors/index.js";
import { SchemaValidator } from "./schema-validator.js";
import type { GovernorConfig } from "./types/interfaces/index.js";

/**
 * Loads governor config from disk and enforces schema validation before use.
 *
 * Why this exists:
 * centralizing file loading avoids each CLI command re-implementing parse/validate flow
 * and reduces config drift bugs.
 */
export class ConfigLoader {
  constructor(private readonly schemaValidator: SchemaValidator = new SchemaValidator()) {}

  /**
   * Loads and validates a YAML config file.
   * @param configPath Absolute or relative path to `governor.yaml`.
   * @returns Parsed and validated governor config.
   */
  public loadFromFile(configPath: string): GovernorConfig {
    const configContent = this.readConfigContent(configPath);
    const parsedConfig = this.parseConfigContent(configContent, configPath);
    return this.schemaValidator.validateOrThrow(parsedConfig);
  }

  /**
   * Reads raw config file content from disk.
   * @param configPath Absolute or relative path to `governor.yaml`.
   * @returns UTF-8 config text content.
   */
  private readConfigContent(configPath: string): string {
    try {
      return readFileSync(configPath, "utf8");
    } catch (error) {
      throw new ConfigError(
        GovernorErrorCode.CONFIG_FILE_READ_FAILED,
        `Failed to read governor config file: ${configPath}`,
        { configPath },
        error,
      );
    }
  }

  /**
   * Parses YAML config content into a plain runtime object.
   * @param configContent Raw yaml content from disk.
   * @param configPath Config path used for contextual error reporting.
   * @returns Parsed YAML object.
   */
  private parseConfigContent(configContent: string, configPath: string): unknown {
    try {
      return parse(configContent);
    } catch (error) {
      throw new ConfigError(
        GovernorErrorCode.CONFIG_FILE_PARSE_FAILED,
        `Failed to parse governor config file: ${configPath}`,
        { configPath },
        error,
      );
    }
  }
}
