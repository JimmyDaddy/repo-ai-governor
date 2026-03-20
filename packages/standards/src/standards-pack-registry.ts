import { GovernorErrorCode, RuntimeError } from "../../shared/src/index.js";
import {
  STANDARDS_PACK_SCOPE_VALUES,
  STANDARDS_PACK_SOURCE_VALUES,
  STANDARDS_PACK_STATUS_VALUES,
  STANDARDS_RENDER_TARGET_VALUES,
  STANDARDS_RULE_SEVERITY_VALUES,
  type StandardsPackScope,
  StandardsPackStatus,
} from "./constants/index.js";
import type {
  ResolvedStandardsRule,
  StandardsPack,
  StandardsPackListOptions,
  StandardsPackRegistryOptions,
  StandardsRuleDefinition,
  StandardsRuleResolveOptions,
} from "./types/index.js";
import { readRequiredString } from "./utils/index.js";

/**
 * Stores and resolves standards packs with deterministic precedence.
 *
 * Why this exists:
 * standards assets can come from official/team/repository layers, so we need one
 * centralized registry to avoid ad-hoc merge rules and semantic drift.
 */
export class StandardsPackRegistry {
  private readonly packById = new Map<string, StandardsPack>();

  public constructor(options: StandardsPackRegistryOptions = {}) {
    const packs = options.packs ?? [];
    if (!Array.isArray(packs)) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        'StandardsPackRegistry option "packs" must be an array.',
      );
    }

    for (const pack of packs) {
      this.registerPack(pack);
    }
  }

  /**
   * Registers or replaces one standards pack.
   * @param pack Standards pack payload.
   * @returns Void.
   */
  public registerPack(pack: StandardsPack): void {
    const normalizedPack = this.normalizePack(pack);
    this.packById.set(normalizedPack.packId, normalizedPack);
  }

  /**
   * Returns one pack by id.
   * @param packId Pack identifier.
   * @returns Pack payload when found.
   */
  public getPack(packId: string): StandardsPack | undefined {
    const normalizedPackId = readRequiredString(
      packId,
      "packId",
      GovernorErrorCode.STANDARDS_PACK_INVALID,
    );
    return this.packById.get(normalizedPackId);
  }

  /**
   * Lists packs with optional scope/status filters.
   * @param options Optional list filters.
   * @returns Filtered and sorted pack list.
   */
  public listPacks(options: StandardsPackListOptions = {}): StandardsPack[] {
    const includeDeprecated = options.includeDeprecated ?? false;
    const normalizedScope =
      options.scope === undefined
        ? undefined
        : this.readEnumValue(options.scope, "scope", STANDARDS_PACK_SCOPE_VALUES);
    const normalizedStatus =
      options.status === undefined
        ? undefined
        : this.readEnumValue(options.status, "status", STANDARDS_PACK_STATUS_VALUES);

    return Array.from(this.packById.values())
      .filter((pack) => {
        if (!includeDeprecated && pack.status === StandardsPackStatus.DEPRECATED) {
          return false;
        }

        if (normalizedScope && pack.scope !== normalizedScope) {
          return false;
        }

        if (normalizedStatus && pack.status !== normalizedStatus) {
          return false;
        }

        return true;
      })
      .sort((left, right) => {
        if (left.mergePrecedence !== right.mergePrecedence) {
          return right.mergePrecedence - left.mergePrecedence;
        }

        return left.packId.localeCompare(right.packId, "en");
      });
  }

  /**
   * Resolves merged rules by semantic key using pack precedence.
   * @param options Optional scope/deprecated filters.
   * @returns Deduplicated rules with provenance metadata.
   */
  public resolveRules(options: StandardsRuleResolveOptions = {}): ResolvedStandardsRule[] {
    const packs = this.listPacks({
      includeDeprecated: options.includeDeprecated,
      scope: options.scope,
    });
    const resolvedRuleBySemanticKey = new Map<string, ResolvedStandardsRule>();

    for (const pack of packs) {
      for (const definition of pack.rules) {
        if (!definition.enabled) {
          continue;
        }

        if (resolvedRuleBySemanticKey.has(definition.semanticKey)) {
          continue;
        }

        resolvedRuleBySemanticKey.set(definition.semanticKey, {
          sourcePackId: pack.packId,
          sourcePackVersion: pack.packVersion,
          sourcePackSource: pack.packSource,
          sourcePackPrecedence: pack.mergePrecedence,
          definition,
        });
      }
    }

    return Array.from(resolvedRuleBySemanticKey.values()).sort((left, right) =>
      left.definition.semanticKey.localeCompare(right.definition.semanticKey, "en"),
    );
  }

  /**
   * Validates and normalizes one standards pack payload.
   * @param pack Raw pack payload.
   * @returns Normalized pack.
   */
  private normalizePack(pack: StandardsPack): StandardsPack {
    if (!pack || typeof pack !== "object") {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        "Standards pack must be an object.",
      );
    }

    const normalizedPackId = readRequiredString(
      pack.packId,
      "pack.packId",
      GovernorErrorCode.STANDARDS_PACK_INVALID,
    );
    const normalizedPackVersion = readRequiredString(
      pack.packVersion,
      "pack.packVersion",
      GovernorErrorCode.STANDARDS_PACK_INVALID,
    );
    const normalizedPackSource = this.readEnumValue(
      pack.packSource,
      "pack.packSource",
      STANDARDS_PACK_SOURCE_VALUES,
    ) as StandardsPack["packSource"];
    const normalizedScope = this.readEnumValue(
      pack.scope,
      "pack.scope",
      STANDARDS_PACK_SCOPE_VALUES,
    ) as StandardsPackScope;
    const normalizedStatus = this.readEnumValue(
      pack.status,
      "pack.status",
      STANDARDS_PACK_STATUS_VALUES,
    ) as StandardsPackStatus;

    if (!Number.isInteger(pack.mergePrecedence)) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        'Field "pack.mergePrecedence" must be an integer.',
        {
          mergePrecedence: pack.mergePrecedence,
        },
      );
    }

    if (!Array.isArray(pack.rules)) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        'Field "pack.rules" must be an array.',
      );
    }

    return {
      packId: normalizedPackId,
      packVersion: normalizedPackVersion,
      packSource: normalizedPackSource,
      scope: normalizedScope,
      mergePrecedence: pack.mergePrecedence,
      status: normalizedStatus,
      rules: pack.rules.map((definition, ruleIndex) =>
        this.normalizeRuleDefinition(definition, `pack.rules[${ruleIndex}]`),
      ),
    };
  }

  /**
   * Validates one rule definition.
   * @param definition Raw rule payload.
   * @param fieldName Field name for diagnostics.
   * @returns Normalized definition.
   */
  private normalizeRuleDefinition(
    definition: StandardsRuleDefinition,
    fieldName: string,
  ): StandardsRuleDefinition {
    if (!definition || typeof definition !== "object") {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        `Field "${fieldName}" must be an object.`,
      );
    }

    const ruleId = readRequiredString(
      definition.ruleId,
      `${fieldName}.ruleId`,
      GovernorErrorCode.STANDARDS_PACK_INVALID,
    );
    const semanticKey = readRequiredString(
      definition.semanticKey,
      `${fieldName}.semanticKey`,
      GovernorErrorCode.STANDARDS_PACK_INVALID,
    );
    const severity = this.readEnumValue(
      definition.severity,
      `${fieldName}.severity`,
      STANDARDS_RULE_SEVERITY_VALUES,
    ) as StandardsRuleDefinition["severity"];

    if (typeof definition.enabled !== "boolean") {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        `Field "${fieldName}.enabled" must be a boolean.`,
      );
    }

    if (!definition.localizedTemplates || typeof definition.localizedTemplates !== "object") {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        `Field "${fieldName}.localizedTemplates" must be an object.`,
      );
    }

    const normalizedLocalizedTemplates: StandardsRuleDefinition["localizedTemplates"] = {};
    for (const [locale, targetTemplateMap] of Object.entries(definition.localizedTemplates)) {
      const normalizedLocale = readRequiredString(
        locale,
        `${fieldName}.localizedTemplates`,
        GovernorErrorCode.STANDARDS_PACK_INVALID,
      );
      if (!targetTemplateMap || typeof targetTemplateMap !== "object") {
        throw new RuntimeError(
          GovernorErrorCode.STANDARDS_PACK_INVALID,
          `Field "${fieldName}.localizedTemplates.${locale}" must be an object.`,
        );
      }

      const normalizedTargetTemplateMap: Record<string, string> = {};
      for (const [target, template] of Object.entries(targetTemplateMap)) {
        const normalizedTarget = this.readEnumValue(
          target,
          `${fieldName}.localizedTemplates.${locale}`,
          STANDARDS_RENDER_TARGET_VALUES,
        );
        normalizedTargetTemplateMap[normalizedTarget] = readRequiredString(
          template,
          `${fieldName}.localizedTemplates.${locale}.${target}`,
          GovernorErrorCode.STANDARDS_PACK_INVALID,
        );
      }

      const missingTargets = Array.from(STANDARDS_RENDER_TARGET_VALUES).filter(
        (target) => !Object.hasOwn(normalizedTargetTemplateMap, target),
      );
      if (missingTargets.length > 0) {
        throw new RuntimeError(
          GovernorErrorCode.STANDARDS_PACK_INVALID,
          `Field "${fieldName}.localizedTemplates.${locale}" is missing render targets.`,
          {
            locale: normalizedLocale,
            missingTargets,
            requiredTargets: Array.from(STANDARDS_RENDER_TARGET_VALUES),
          },
        );
      }

      normalizedLocalizedTemplates[normalizedLocale] =
        normalizedTargetTemplateMap as StandardsRuleDefinition["localizedTemplates"][string];
    }

    const normalizedMetadata = definition.metadata
      ? this.normalizeMetadata(definition.metadata)
      : undefined;

    return {
      ruleId,
      semanticKey,
      severity,
      enabled: definition.enabled,
      localizedTemplates: normalizedLocalizedTemplates,
      ...(normalizedMetadata ? { metadata: normalizedMetadata } : {}),
    };
  }

  /**
   * Validates metadata payload while preserving arbitrary key-value pairs.
   * @param metadata Raw metadata object.
   * @returns Normalized metadata map.
   */
  private normalizeMetadata(metadata: Record<string, string>): Record<string, string> {
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        'Field "metadata" must be a plain object when provided.',
      );
    }

    const normalizedMetadata: Record<string, string> = {};
    for (const [key, value] of Object.entries(metadata)) {
      const normalizedKey = readRequiredString(
        key,
        "metadata.key",
        GovernorErrorCode.STANDARDS_PACK_INVALID,
      );
      normalizedMetadata[normalizedKey] = readRequiredString(
        value,
        `metadata.${key}`,
        GovernorErrorCode.STANDARDS_PACK_INVALID,
      );
    }

    return normalizedMetadata;
  }

  /**
   * Validates one finite-set enum value.
   * @param value Raw value.
   * @param fieldName Field name for diagnostics.
   * @param enumValues Accepted value set.
   * @returns Normalized enum string.
   */
  private readEnumValue(value: unknown, fieldName: string, enumValues: Set<string>): string {
    const normalizedValue = readRequiredString(
      value,
      fieldName,
      GovernorErrorCode.STANDARDS_PACK_INVALID,
    );
    if (!enumValues.has(normalizedValue)) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        `Field "${fieldName}" contains unsupported value.`,
        {
          value: normalizedValue,
          allowedValues: Array.from(enumValues),
        },
      );
    }

    return normalizedValue;
  }
}
