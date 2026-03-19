/**
 * Defines supported rendering environments for standardized error output.
 *
 * Why this exists:
 * centralizing output modes prevents ad-hoc string literals from drifting across packages.
 */
export enum ErrorOutputEnvironment {
  PRETTY = "pretty",
  PLAIN = "plain",
  JSON = "json",
}

/**
 * Defines error scenarios used for routing and structured reporting.
 *
 * Why this exists:
 * scenario values are consumed by multiple packages and should remain stable.
 */
export enum ErrorScenario {
  CONFIG = "config",
  I18N = "i18n",
  RUNTIME = "runtime",
}
