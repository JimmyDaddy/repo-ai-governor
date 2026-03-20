import {
  RuleRenderer,
  StandardsPackRegistry,
  StandardsPackScope,
  StandardsPackSource,
  StandardsPackStatus,
  StandardsRenderTarget,
  StandardsRuleSeverity,
  StandardsUpgradePlanner,
  StandardsUpgradeRequiredAction,
} from "../src/index.js";

describe("standards unit", () => {
  it("resolves and renders rules from the highest-precedence active pack", () => {
    const registry = new StandardsPackRegistry({
      packs: [
        {
          packId: "official-pack",
          packVersion: "1.0.0",
          packSource: StandardsPackSource.OFFICIAL,
          scope: StandardsPackScope.GLOBAL,
          mergePrecedence: 10,
          status: StandardsPackStatus.ACTIVE,
          rules: [
            {
              ruleId: "rule-001",
              semanticKey: "code.naming",
              severity: StandardsRuleSeverity.REQUIRED,
              enabled: true,
              localizedTemplates: {
                "zh-CN": {
                  human: "命名必须使用 {{style}}。",
                  ai: "命名必须使用 {{style}}。",
                  agents: "命名必须使用 {{style}}。",
                },
                "en-US": {
                  human: "Naming must use {{style}}.",
                  ai: "Naming must use {{style}}.",
                  agents: "Naming must use {{style}}.",
                },
              },
            },
          ],
        },
      ],
    });
    const renderer = new RuleRenderer({
      registry,
      defaultLocale: "zh-CN",
      fallbackLocale: "en-US",
    });

    const renderResult = renderer.render({
      target: StandardsRenderTarget.AI,
      locale: "zh-CN",
      interpolationBySemanticKey: {
        "code.naming": {
          style: "camelCase",
        },
      },
    });

    expect(renderResult.renderedRules).toHaveLength(1);
    expect(renderResult.renderedRules[0]?.text).toContain("camelCase");
  });

  it("blocks major-version upgrade by default pin policy", () => {
    const planner = new StandardsUpgradePlanner();
    const result = planner.plan({
      currentPacks: [
        {
          packId: "official-pack",
          packVersion: "1.2.0",
          packSource: StandardsPackSource.OFFICIAL,
          scope: StandardsPackScope.GLOBAL,
        },
      ],
      targetPacks: [
        {
          packId: "official-pack",
          packVersion: "2.0.0",
          packSource: StandardsPackSource.OFFICIAL,
          scope: StandardsPackScope.GLOBAL,
        },
      ],
    });

    expect(result.requiredAction).toBe(StandardsUpgradeRequiredAction.BLOCK);
    expect(result.blockingConflicts).toHaveLength(1);
  });
});
