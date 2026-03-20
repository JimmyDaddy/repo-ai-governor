import { GovernorErrorCode, RuntimeError } from "../../shared/src/index.js";
import {
  AgentsProjectionMetadataKey,
  DEFAULT_AGENTS_PROJECTION_TARGET,
  StandardsRenderTarget,
} from "./constants/index.js";
import { DefaultAgentsProjectionNowProvider } from "./providers/index.js";
import type {
  AgentsProjectionNowProviderContract,
  AgentsProjectionSourcePackRef,
  AgentsProjectorOptions,
  AgentsProjectorProjectInput,
  AgentsProjectorProjectResult,
  RenderedStandardsRule,
  StandardsProjectionParityResult,
  StandardsProjectionParityViolation,
  StandardsRuleRendererReader,
} from "./types/index.js";
import { readRequiredString } from "./utils/index.js";

interface NormalizedAgentsProjectorOptions {
  renderer: StandardsRuleRendererReader;
  defaultProjectionTarget: string;
  nowProvider: AgentsProjectionNowProviderContract;
}

interface ProjectionRuleSignature {
  ruleId: string;
  sourcePackId: string;
  sourcePackVersion: string;
}

/**
 * Projects `agents` standards view into AGENTS-compatible text with parity checks.
 *
 * Why this exists:
 * standards rules are authored once and rendered to human/ai/agents views, so
 * projection must verify semantic alignment before producing AGENTS artifacts.
 */
export class AgentsProjector {
  private readonly resolvedOptions: NormalizedAgentsProjectorOptions;

  public constructor(options: AgentsProjectorOptions) {
    this.resolvedOptions = this.resolveOptions(options);
  }

  /**
   * Projects one AGENTS-facing document and validates projection parity.
   * @param input Projection input payload.
   * @returns Structured projection result with traceable metadata.
   */
  public project(input: AgentsProjectorProjectInput = {}): AgentsProjectorProjectResult {
    if (!input || typeof input !== "object") {
      throw new RuntimeError(
        GovernorErrorCode.AGENTS_PROJECTION_INVALID,
        "Agents projector input must be an object.",
      );
    }

    const projectionTarget = readRequiredString(
      input.projectionTarget ?? this.resolvedOptions.defaultProjectionTarget,
      "input.projectionTarget",
      GovernorErrorCode.AGENTS_PROJECTION_INVALID,
    );

    const agentsResult = this.resolvedOptions.renderer.render({
      target: StandardsRenderTarget.AGENTS,
      locale: input.locale,
      scope: input.scope,
      interpolationByRuleId: input.interpolationByRuleId,
      interpolationBySemanticKey: input.interpolationBySemanticKey,
    });
    const humanResult = this.resolvedOptions.renderer.render({
      target: StandardsRenderTarget.HUMAN,
      locale: input.locale,
      scope: input.scope,
      interpolationByRuleId: input.interpolationByRuleId,
      interpolationBySemanticKey: input.interpolationBySemanticKey,
    });
    const aiResult = this.resolvedOptions.renderer.render({
      target: StandardsRenderTarget.AI,
      locale: input.locale,
      scope: input.scope,
      interpolationByRuleId: input.interpolationByRuleId,
      interpolationBySemanticKey: input.interpolationBySemanticKey,
    });

    const parity = this.evaluateProjectionParity(
      agentsResult.renderedRules,
      humanResult.renderedRules,
      aiResult.renderedRules,
    );
    const enforceParity = input.enforceParity ?? true;
    if (enforceParity && !parity.isAligned) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PROJECTION_PARITY_FAILED,
        "Agents projection parity check failed across human/ai/agents targets.",
        {
          projectionTarget,
          violations: parity.violations,
        },
      );
    }

    const projectedAt = this.resolvedOptions.nowProvider.now().toISOString();
    const sourcePackRefs = this.collectSourcePackRefs(agentsResult.renderedRules);
    const projectedContent = this.renderProjectedContent({
      projectionTarget,
      projectedAt,
      locale: agentsResult.locale,
      sourcePackRefs,
      parity,
      renderedRules: agentsResult.renderedRules,
    });

    return {
      projectionTarget,
      projectedAt,
      locale: agentsResult.locale,
      sourcePackRefs,
      parity,
      renderedRules: agentsResult.renderedRules,
      projectedContent,
    };
  }

  /**
   * Validates and normalizes projector options.
   * @param options Raw options.
   * @returns Normalized options.
   */
  private resolveOptions(options: AgentsProjectorOptions): NormalizedAgentsProjectorOptions {
    if (!options || typeof options !== "object") {
      throw new RuntimeError(
        GovernorErrorCode.AGENTS_PROJECTION_INVALID,
        "Agents projector options must be an object.",
      );
    }

    if (!options.renderer || typeof options.renderer.render !== "function") {
      throw new RuntimeError(
        GovernorErrorCode.AGENTS_PROJECTION_INVALID,
        'Agents projector option "renderer" must provide render().',
      );
    }

    const defaultProjectionTarget = readRequiredString(
      options.defaultProjectionTarget ?? DEFAULT_AGENTS_PROJECTION_TARGET,
      "options.defaultProjectionTarget",
      GovernorErrorCode.AGENTS_PROJECTION_INVALID,
    );

    return {
      renderer: options.renderer,
      defaultProjectionTarget,
      nowProvider: options.nowProvider ?? new DefaultAgentsProjectionNowProvider(),
    };
  }

  /**
   * Evaluates semantic/source alignment across projection targets.
   * @param agentsRules Rules rendered for agents target.
   * @param humanRules Rules rendered for human target.
   * @param aiRules Rules rendered for ai target.
   * @returns Parity result with mismatch records when detected.
   */
  private evaluateProjectionParity(
    agentsRules: RenderedStandardsRule[],
    humanRules: RenderedStandardsRule[],
    aiRules: RenderedStandardsRule[],
  ): StandardsProjectionParityResult {
    const baselineMap = this.buildRuleSignatureMap(agentsRules);
    const comparedTargets: Array<{
      target: StandardsRenderTarget;
      signatureMap: Map<string, ProjectionRuleSignature>;
    }> = [
      {
        target: StandardsRenderTarget.HUMAN,
        signatureMap: this.buildRuleSignatureMap(humanRules),
      },
      {
        target: StandardsRenderTarget.AI,
        signatureMap: this.buildRuleSignatureMap(aiRules),
      },
    ];

    const violations: StandardsProjectionParityViolation[] = [];
    for (const comparedTarget of comparedTargets) {
      const semanticKeys = new Set<string>([
        ...baselineMap.keys(),
        ...comparedTarget.signatureMap.keys(),
      ]);
      for (const semanticKey of semanticKeys) {
        const expected = baselineMap.get(semanticKey);
        const actual = comparedTarget.signatureMap.get(semanticKey);
        if (!expected || !actual) {
          violations.push({
            semanticKey,
            target: comparedTarget.target,
            reason: "semantic-key-missing",
            ...(expected ? { expectedRuleId: expected.ruleId } : {}),
            ...(actual ? { actualRuleId: actual.ruleId } : {}),
          });
          continue;
        }

        if (
          expected.ruleId !== actual.ruleId ||
          expected.sourcePackId !== actual.sourcePackId ||
          expected.sourcePackVersion !== actual.sourcePackVersion
        ) {
          violations.push({
            semanticKey,
            target: comparedTarget.target,
            reason: "rule-signature-mismatch",
            expectedRuleId: expected.ruleId,
            actualRuleId: actual.ruleId,
            expectedSourcePackId: expected.sourcePackId,
            actualSourcePackId: actual.sourcePackId,
            expectedSourcePackVersion: expected.sourcePackVersion,
            actualSourcePackVersion: actual.sourcePackVersion,
          });
        }
      }
    }

    return {
      isAligned: violations.length === 0,
      violations,
    };
  }

  /**
   * Builds semantic-key -> signature map from one target render list.
   * @param renderedRules One target rendered rules.
   * @returns Signature map used by parity checks.
   */
  private buildRuleSignatureMap(
    renderedRules: RenderedStandardsRule[],
  ): Map<string, ProjectionRuleSignature> {
    const signatureMap = new Map<string, ProjectionRuleSignature>();
    for (const renderedRule of renderedRules) {
      signatureMap.set(renderedRule.semanticKey, {
        ruleId: renderedRule.ruleId,
        sourcePackId: renderedRule.sourcePackId,
        sourcePackVersion: renderedRule.sourcePackVersion,
      });
    }

    return signatureMap;
  }

  /**
   * Collects unique source-pack references from rendered rules.
   * @param renderedRules Agents-rendered rule list.
   * @returns Sorted source-pack reference array.
   */
  private collectSourcePackRefs(
    renderedRules: RenderedStandardsRule[],
  ): AgentsProjectionSourcePackRef[] {
    const sourcePackRefByKey = new Map<string, AgentsProjectionSourcePackRef>();
    for (const renderedRule of renderedRules) {
      const key = `${renderedRule.sourcePackId}@@${renderedRule.sourcePackVersion}`;
      if (sourcePackRefByKey.has(key)) {
        continue;
      }

      sourcePackRefByKey.set(key, {
        packId: renderedRule.sourcePackId,
        packVersion: renderedRule.sourcePackVersion,
      });
    }

    return Array.from(sourcePackRefByKey.values()).sort((left, right) => {
      const packIdComparison = left.packId.localeCompare(right.packId, "en");
      if (packIdComparison !== 0) {
        return packIdComparison;
      }

      return left.packVersion.localeCompare(right.packVersion, "en");
    });
  }

  /**
   * Renders AGENTS projection text with traceable metadata header.
   * @param input Projection metadata and rendered agents rules.
   * @returns Projected text content ready for write/persist.
   */
  private renderProjectedContent(input: {
    projectionTarget: string;
    projectedAt: string;
    locale: string;
    sourcePackRefs: AgentsProjectionSourcePackRef[];
    parity: StandardsProjectionParityResult;
    renderedRules: RenderedStandardsRule[];
  }): string {
    const sourcePackRefSummary =
      input.sourcePackRefs.length === 0
        ? "(none)"
        : input.sourcePackRefs
            .map((sourcePackRef) => `${sourcePackRef.packId}@${sourcePackRef.packVersion}`)
            .join(", ");

    const lines: string[] = [
      "# AGENTS.md Projection",
      "",
      `${AgentsProjectionMetadataKey.PROJECTION_TARGET}: ${input.projectionTarget}`,
      `${AgentsProjectionMetadataKey.PROJECTED_AT}: ${input.projectedAt}`,
      `${AgentsProjectionMetadataKey.LOCALE}: ${input.locale}`,
      `${AgentsProjectionMetadataKey.SOURCE_PACK_REFS}: ${sourcePackRefSummary}`,
      `${AgentsProjectionMetadataKey.PROJECTION_PARITY}: ${input.parity.isAligned ? "aligned" : "violated"}`,
      "",
      "## Agents Rules",
    ];

    if (input.renderedRules.length === 0) {
      lines.push("(none)");
      return lines.join("\n");
    }

    for (const [index, renderedRule] of input.renderedRules.entries()) {
      const ruleNumber = index + 1;
      lines.push(
        `${ruleNumber}. [${renderedRule.severity}] ${renderedRule.semanticKey} (${renderedRule.ruleId})`,
      );
      lines.push(`   source: ${renderedRule.sourcePackId}@${renderedRule.sourcePackVersion}`);
      lines.push(`   text: ${renderedRule.text}`);
    }

    return lines.join("\n");
  }
}
