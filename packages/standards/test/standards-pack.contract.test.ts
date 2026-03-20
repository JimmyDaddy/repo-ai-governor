import { GovernorErrorCode, RuntimeError } from "../../shared/src/index.js";
import {
  RuleRenderer,
  StandardsPackRegistry,
  StandardsPackScope,
  StandardsPackSource,
  StandardsPackStatus,
  StandardsRenderTarget,
  StandardsRuleSeverity,
} from "../src/index.js";
import type { StandardsPack } from "../src/index.js";

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
      {
        ruleId: "rule.docs.triad.sync",
        semanticKey: "rule.docs.triad.sync",
        severity: StandardsRuleSeverity.RECOMMENDED,
        enabled: true,
        localizedTemplates: {
          "zh-CN": {
            [StandardsRenderTarget.HUMAN]: "需求/方案/架构三层文档应同步变更。",
            [StandardsRenderTarget.AI]: "Keep requirement/solution/architecture docs synchronized.",
            [StandardsRenderTarget.AGENTS]: "Sync triad docs in one changeset.",
          },
          "en-US": {
            [StandardsRenderTarget.HUMAN]:
              "Requirement/solution/architecture docs should be updated together.",
            [StandardsRenderTarget.AI]: "Keep requirement/solution/architecture docs synchronized.",
            [StandardsRenderTarget.AGENTS]: "Sync triad docs in one changeset.",
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

describe("StandardsPackRegistry smoke", () => {
  it("resolves higher-precedence rule for identical semanticKey", () => {
    const officialPack = createStandardsPackFixture();
    const repositoryPack = createStandardsPackFixture({
      packId: "pack.repo.override",
      packSource: StandardsPackSource.REPOSITORY,
      scope: StandardsPackScope.REPOSITORY,
      mergePrecedence: 100,
      rules: [
        {
          ruleId: "rule.hitl.review.required.repo",
          semanticKey: "rule.hitl.review.required",
          severity: StandardsRuleSeverity.REQUIRED,
          enabled: true,
          localizedTemplates: {
            "zh-CN": {
              [StandardsRenderTarget.HUMAN]: "仓库策略要求人工复核：{{stage}}。",
              [StandardsRenderTarget.AI]: "Repository policy requires manual review: {{stage}}.",
              [StandardsRenderTarget.AGENTS]: "Repository rule: require HITL review: {{stage}}.",
            },
            "en-US": {
              [StandardsRenderTarget.HUMAN]: "Repository policy requires manual review: {{stage}}.",
              [StandardsRenderTarget.AI]: "Repository policy requires manual review: {{stage}}.",
              [StandardsRenderTarget.AGENTS]: "Repository rule: require HITL review: {{stage}}.",
            },
          },
        },
      ],
    });

    const standardsPackRegistry = new StandardsPackRegistry({
      packs: [officialPack, repositoryPack],
    });

    const resolvedRules = standardsPackRegistry.resolveRules();
    const resolvedHitlRule = resolvedRules.find(
      (resolvedRule) => resolvedRule.definition.semanticKey === "rule.hitl.review.required",
    );

    expect(resolvedHitlRule?.sourcePackId).toBe("pack.repo.override");
    expect(resolvedHitlRule?.definition.ruleId).toBe("rule.hitl.review.required.repo");
  });

  it("filters deprecated packs by default and includes them when requested", () => {
    const deprecatedPack = createStandardsPackFixture({
      packId: "pack.deprecated",
      status: StandardsPackStatus.DEPRECATED,
    });

    const standardsPackRegistry = new StandardsPackRegistry({
      packs: [createStandardsPackFixture(), deprecatedPack],
    });

    expect(standardsPackRegistry.listPacks()).toHaveLength(1);
    expect(standardsPackRegistry.listPacks({ includeDeprecated: true })).toHaveLength(2);
  });
});

describe("RuleRenderer smoke", () => {
  it("renders rule text with locale fallback and interpolation", () => {
    const standardsPackRegistry = new StandardsPackRegistry({
      packs: [createStandardsPackFixture()],
    });
    const ruleRenderer = new RuleRenderer({
      registry: standardsPackRegistry,
    });

    const renderResult = ruleRenderer.render({
      target: StandardsRenderTarget.HUMAN,
      locale: "zh-TW",
      interpolationByRuleId: {
        "rule.hitl.review.required": {
          stage: "stage-policy",
        },
      },
    });

    const renderedHitlRule = renderResult.renderedRules.find(
      (renderedRule) => renderedRule.ruleId === "rule.hitl.review.required",
    );
    expect(renderedHitlRule?.locale).toBe("zh-CN");
    expect(renderedHitlRule?.text).toContain("stage-policy");
  });

  it("uses semanticKey interpolation fallback when ruleId payload is absent", () => {
    const standardsPackRegistry = new StandardsPackRegistry({
      packs: [createStandardsPackFixture()],
    });
    const ruleRenderer = new RuleRenderer({
      registry: standardsPackRegistry,
    });

    const renderResult = ruleRenderer.render({
      target: StandardsRenderTarget.HUMAN,
      locale: "en-US",
      interpolationBySemanticKey: {
        "rule.hitl.review.required": {
          stage: "stage-semantic-fallback",
        },
      },
    });

    const renderedHitlRule = renderResult.renderedRules.find(
      (renderedRule) => renderedRule.semanticKey === "rule.hitl.review.required",
    );
    expect(renderedHitlRule?.text).toContain("stage-semantic-fallback");
  });

  it("prefers ruleId interpolation when both ruleId and semanticKey payloads are provided", () => {
    const standardsPackRegistry = new StandardsPackRegistry({
      packs: [createStandardsPackFixture()],
    });
    const ruleRenderer = new RuleRenderer({
      registry: standardsPackRegistry,
    });

    const renderResult = ruleRenderer.render({
      target: StandardsRenderTarget.HUMAN,
      locale: "en-US",
      interpolationByRuleId: {
        "rule.hitl.review.required": {
          stage: "stage-rule-id-priority",
        },
      },
      interpolationBySemanticKey: {
        "rule.hitl.review.required": {
          stage: "stage-semantic-fallback",
        },
      },
    });

    const renderedHitlRule = renderResult.renderedRules.find(
      (renderedRule) => renderedRule.ruleId === "rule.hitl.review.required",
    );
    expect(renderedHitlRule?.text).toContain("stage-rule-id-priority");
  });

  it("fails fast during registration when one locale misses render targets", () => {
    const brokenPack = createStandardsPackFixture({
      rules: [
        {
          ruleId: "rule.template.missing",
          semanticKey: "rule.template.missing",
          severity: StandardsRuleSeverity.ADVISORY,
          enabled: true,
          localizedTemplates: {
            "en-US": {
              [StandardsRenderTarget.HUMAN]: "Human-only template.",
              [StandardsRenderTarget.AI]: "AI-only template.",
            } as Record<StandardsRenderTarget, string>,
          },
        },
      ],
    });

    expect(() => new StandardsPackRegistry({ packs: [brokenPack] })).toThrowError(RuntimeError);

    try {
      new StandardsPackRegistry({ packs: [brokenPack] });
    } catch (error) {
      const runtimeError = error as RuntimeError;
      expect(runtimeError.code).toBe(GovernorErrorCode.STANDARDS_PACK_INVALID);
    }
  });
});
