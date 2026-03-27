import {
  AgentsProjector,
  RuleRenderer,
  StandardsPackRegistry,
  StandardsRenderTarget,
  goMinimalGovernancePack,
  pythonMinimalGovernancePack,
} from "../src/index.js";
import type { StandardsPack } from "../src/index.js";

const RENDER_TARGETS = [
  StandardsRenderTarget.HUMAN,
  StandardsRenderTarget.AI,
  StandardsRenderTarget.AGENTS,
] as const;

/**
 * Verifies one minimal language pack can be rendered across all targets.
 * @param pack Target language pack.
 */
function expectPackToRender(pack: StandardsPack): void {
  const standardsPackRegistry = new StandardsPackRegistry({
    packs: [pack],
  });
  const ruleRenderer = new RuleRenderer({
    registry: standardsPackRegistry,
  });
  const agentsProjector = new AgentsProjector({
    renderer: ruleRenderer,
  });

  for (const renderTarget of RENDER_TARGETS) {
    const renderResult = ruleRenderer.render({
      target: renderTarget,
      locale: "en-US",
    });

    expect(renderResult.renderedRules).toHaveLength(pack.rules.length);
    expect(
      renderResult.renderedRules.every((renderedRule) => renderedRule.sourcePackId === pack.packId),
    ).toBe(true);
  }

  const zhProjection = agentsProjector.project({
    locale: "zh-CN",
  });

  expect(zhProjection.parity.isAligned).toBe(true);
  expect(zhProjection.sourcePackRefs).toEqual([
    {
      packId: pack.packId,
      packVersion: pack.packVersion,
    },
  ]);
  expect(zhProjection.renderedRules).toHaveLength(pack.rules.length);
}

describe("minimal language governance packs", () => {
  it("provides one renderable Python governance baseline pack", () => {
    expect(pythonMinimalGovernancePack.rules.map((rule) => rule.semanticKey)).toEqual([
      "rule.python.project.pyproject",
      "rule.python.lint.ruff",
      "rule.python.test.pytest",
      "rule.python.types.pyright",
    ]);
    expectPackToRender(pythonMinimalGovernancePack);
  });

  it("provides one renderable Go governance baseline pack", () => {
    expect(goMinimalGovernancePack.rules.map((rule) => rule.semanticKey)).toEqual([
      "rule.go.project.modules",
      "rule.go.format.go-fmt",
      "rule.go.test.go-test",
      "rule.go.vet.go-vet",
    ]);
    expectPackToRender(goMinimalGovernancePack);
  });
});
