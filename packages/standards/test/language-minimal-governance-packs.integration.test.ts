import {
  AgentsProjector,
  RuleRenderer,
  StandardsPackRegistry,
  StandardsRenderTarget,
  goMinimalGovernancePack,
  javascriptMinimalGovernancePack,
  pythonMinimalGovernancePack,
  rustMinimalGovernancePack,
  workflowReviewGovernancePack,
} from '../src/index.js';
import type { AgentsProjectorProjectResult, StandardsPack } from '../src/index.js';

const RENDER_TARGETS = [
  StandardsRenderTarget.HUMAN,
  StandardsRenderTarget.AI,
  StandardsRenderTarget.AGENTS,
] as const;

/**
 * Verifies one built-in governance pack can be rendered across all targets.
 * @param pack Target pack.
 */
function expectPackToRender(pack: StandardsPack): AgentsProjectorProjectResult {
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
      locale: 'en-US',
    });

    expect(renderResult.renderedRules).toHaveLength(pack.rules.length);
    expect(
      renderResult.renderedRules.every((renderedRule) => renderedRule.sourcePackId === pack.packId),
    ).toBe(true);
  }

  const zhProjection = agentsProjector.project({
    locale: 'zh-CN',
  });

  expect(zhProjection.parity.isAligned).toBe(true);
  expect(zhProjection.sourcePackRefs).toEqual([
    {
      packId: pack.packId,
      packVersion: pack.packVersion,
    },
  ]);
  expect(zhProjection.renderedRules).toHaveLength(pack.rules.length);
  return zhProjection;
}

describe('built-in governance packs', () => {
  it('provides one renderable workflow review governance baseline pack', () => {
    expect(workflowReviewGovernancePack.rules.map((rule) => rule.semanticKey)).toEqual([
      'rule.workflow.review.cr-task-card',
      'rule.workflow.review.lifecycle-sync',
    ]);

    const projection = expectPackToRender(workflowReviewGovernancePack);
    expect(projection.projectedContent).toContain('CR-xxx');
    expect(projection.projectedContent).toContain('review_pending -> verified -> resolved');
  });

  it('provides one renderable JavaScript governance baseline pack', () => {
    expect(javascriptMinimalGovernancePack.rules.map((rule) => rule.semanticKey)).toEqual([
      'rule.javascript.project.package-manifest',
      'rule.javascript.lint.project-script',
      'rule.javascript.test.project-script',
      'rule.javascript.runtime.build-or-typecheck',
    ]);

    const projection = expectPackToRender(javascriptMinimalGovernancePack);
    expect(projection.projectedContent).toContain('package.json');
    expect(projection.projectedContent).toContain('lint or formatter');
  });

  it('provides one renderable Python governance baseline pack', () => {
    expect(pythonMinimalGovernancePack.rules.map((rule) => rule.semanticKey)).toEqual([
      'rule.python.project.pyproject',
      'rule.python.lint.ruff',
      'rule.python.test.pytest',
      'rule.python.types.pyright',
    ]);
    expectPackToRender(pythonMinimalGovernancePack);
  });

  it('provides one renderable Go governance baseline pack', () => {
    expect(goMinimalGovernancePack.rules.map((rule) => rule.semanticKey)).toEqual([
      'rule.go.project.modules',
      'rule.go.format.go-fmt',
      'rule.go.test.go-test',
      'rule.go.vet.go-vet',
    ]);
    expectPackToRender(goMinimalGovernancePack);
  });

  it('provides one renderable Rust governance baseline pack', () => {
    expect(rustMinimalGovernancePack.rules.map((rule) => rule.semanticKey)).toEqual([
      'rule.rust.project.cargo-manifest',
      'rule.rust.format.cargo-fmt',
      'rule.rust.lint.cargo-clippy',
      'rule.rust.test.cargo-test',
    ]);

    const projection = expectPackToRender(rustMinimalGovernancePack);
    expect(projection.projectedContent).toContain('cargo fmt --all --check');
    expect(projection.projectedContent).toContain('cargo test --workspace');
  });
});
