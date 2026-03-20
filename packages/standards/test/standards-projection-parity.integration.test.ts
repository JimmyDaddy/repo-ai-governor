import { GovernorErrorCode, RuntimeError } from "../../shared/src/index.js";
import {
  AgentsProjectionMetadataKey,
  AgentsProjectionNowProvider,
  AgentsProjector,
  RuleRenderer,
  StandardsPackRegistry,
  StandardsPackScope,
  StandardsPackSource,
  StandardsPackStatus,
  StandardsRenderTarget,
  StandardsRuleSeverity,
} from "../src/index.js";
import type {
  RuleRendererRenderInput,
  RuleRendererRenderResult,
  StandardsPack,
  StandardsRuleRendererReader,
} from "../src/index.js";

class FixedAgentsProjectionNowProvider extends AgentsProjectionNowProvider {
  public override now(): Date {
    return new Date("2026-03-20T10:00:00.000Z");
  }
}

class ProjectionParityBreakingRenderer implements StandardsRuleRendererReader {
  public render(input: RuleRendererRenderInput): RuleRendererRenderResult {
    const sharedRule = {
      semanticKey: "rule.hitl.review.required",
      severity: StandardsRuleSeverity.REQUIRED,
      locale: "en-US",
      sourcePackId: "pack.official.baseline",
      sourcePackVersion: "1.0.0",
    } as const;

    if (input.target === StandardsRenderTarget.AGENTS) {
      return {
        target: input.target,
        locale: "en-US",
        renderedRules: [
          {
            ruleId: "rule.hitl.review.required",
            target: StandardsRenderTarget.AGENTS,
            text: "Require HITL review.",
            ...sharedRule,
          },
        ],
      };
    }

    if (input.target === StandardsRenderTarget.HUMAN) {
      return {
        target: input.target,
        locale: "en-US",
        renderedRules: [],
      };
    }

    return {
      target: input.target,
      locale: "en-US",
      renderedRules: [
        {
          ruleId: "rule.hitl.review.required",
          target: StandardsRenderTarget.AI,
          text: "Gate requires manual review.",
          ...sharedRule,
        },
      ],
    };
  }
}

function createStandardsPackFixture(overrides: Partial<StandardsPack> = {}): StandardsPack {
  const baseFixture: StandardsPack = {
    packId: "pack.official.baseline",
    packVersion: "1.0.0",
    packSource: StandardsPackSource.OFFICIAL,
    scope: StandardsPackScope.GLOBAL,
    mergePrecedence: 10,
    status: StandardsPackStatus.ACTIVE,
    rules: [
      {
        ruleId: "rule.hitl.review.required",
        semanticKey: "rule.hitl.review.required",
        severity: StandardsRuleSeverity.REQUIRED,
        enabled: true,
        localizedTemplates: {
          "zh-CN": {
            [StandardsRenderTarget.HUMAN]: "必须完成人工复核后才能继续执行：{{stage}}。",
            [StandardsRenderTarget.AI]: "Gate requires manual review before continuing: {{stage}}.",
            [StandardsRenderTarget.AGENTS]: "Require HITL review before next step: {{stage}}.",
          },
          "en-US": {
            [StandardsRenderTarget.HUMAN]:
              "Manual review is required before continuing: {{stage}}.",
            [StandardsRenderTarget.AI]: "Gate requires manual review before continuing: {{stage}}.",
            [StandardsRenderTarget.AGENTS]: "Require HITL review before next step: {{stage}}.",
          },
        },
      },
    ],
  };

  return {
    ...baseFixture,
    ...overrides,
    rules: overrides.rules ?? baseFixture.rules,
  };
}

describe("AgentsProjector smoke", () => {
  it("projects agents view with traceable metadata and aligned parity", () => {
    const standardsPackRegistry = new StandardsPackRegistry({
      packs: [createStandardsPackFixture()],
    });
    const ruleRenderer = new RuleRenderer({
      registry: standardsPackRegistry,
    });
    const agentsProjector = new AgentsProjector({
      renderer: ruleRenderer,
      nowProvider: new FixedAgentsProjectionNowProvider(),
    });

    const projectionResult = agentsProjector.project({
      locale: "en-US",
      interpolationBySemanticKey: {
        "rule.hitl.review.required": {
          stage: "stage-projection",
        },
      },
    });

    expect(projectionResult.projectionTarget).toBe("AGENTS.md");
    expect(projectionResult.projectedAt).toBe("2026-03-20T10:00:00.000Z");
    expect(projectionResult.parity.isAligned).toBe(true);
    expect(projectionResult.parity.violations).toHaveLength(0);
    expect(projectionResult.sourcePackRefs).toEqual([
      {
        packId: "pack.official.baseline",
        packVersion: "1.0.0",
      },
    ]);
    expect(projectionResult.projectedContent).toContain(
      `${AgentsProjectionMetadataKey.PROJECTION_TARGET}: AGENTS.md`,
    );
    expect(projectionResult.projectedContent).toContain(
      `${AgentsProjectionMetadataKey.SOURCE_PACK_REFS}: pack.official.baseline@1.0.0`,
    );
    expect(projectionResult.projectedContent).toContain("stage-projection");
  });

  it("throws standardized error when projection parity is violated", () => {
    const agentsProjector = new AgentsProjector({
      renderer: new ProjectionParityBreakingRenderer(),
      nowProvider: new FixedAgentsProjectionNowProvider(),
    });

    expect(() =>
      agentsProjector.project({
        locale: "en-US",
      }),
    ).toThrowError(RuntimeError);

    try {
      agentsProjector.project({
        locale: "en-US",
      });
    } catch (error) {
      const runtimeError = error as RuntimeError;
      expect(runtimeError.code).toBe(GovernorErrorCode.STANDARDS_PROJECTION_PARITY_FAILED);
    }
  });

  it("returns parity violations without throwing when enforceParity is false", () => {
    const agentsProjector = new AgentsProjector({
      renderer: new ProjectionParityBreakingRenderer(),
      nowProvider: new FixedAgentsProjectionNowProvider(),
    });

    const projectionResult = agentsProjector.project({
      locale: "en-US",
      enforceParity: false,
    });

    expect(projectionResult.parity.isAligned).toBe(false);
    expect(projectionResult.parity.violations.length).toBeGreaterThan(0);
  });
});
