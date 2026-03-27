# @repo-ai-governor/standards

`standards` 包提供 Stage 4 的 Standards Pack 基线能力：

1. `StandardsPackRegistry`：登记并解析规范包，按 `mergePrecedence` 合并同语义规则。
2. `RuleRenderer`：将同源语义规则渲染到 `human/ai/agents` 三类目标输出。
3. `AgentsProjector`：将 `agents` 视图投影为 `AGENTS.md` 兼容文本，并附带 `projection_target/projected_at/source_pack_refs` 元数据与 parity 校验。
4. `StandardsUpgradePlanner`：输出升级冲突分级（阻断/可自动修复/建议）、回滚步骤与版本 pin 决策。

设计约束：

1. 同一条规则通过 `semanticKey` 作为唯一语义锚点。
2. 多视图渲染必须共用同一语义锚点，不允许跨视图语义分叉。
3. locale 解析遵循 `requested -> language-base -> default -> fallback`，保证弱网络/降级场景稳定可读。
4. `agents` 投影默认启用 human/ai/agents parity 校验，防止投影视图与同源规则资产漂移。
5. 升级规划默认执行 major 锁定策略，并提供 minor/patch 自动升级开关与回滚引用字段。

## Projection Chain Status

1. `packages/standards/test/standards-projection-parity.integration.test.ts` 现在覆盖 `StandardsPackRegistry -> RuleRenderer -> AgentsProjector -> AGENTS.md` 文件落盘链路，用于验证三视图来源与 AGENTS 投影结果闭环。
2. `AgentsProjector` 当前负责生成带 `projection_target/projected_at/source_pack_refs` 元数据的 `projectedContent`；具体写入哪个 `AGENTS.md` 路径由调用方决定。
3. 当前仓库根级 `AGENTS.md` 仍是手工维护的治理入口，不是由 `AgentsProjector` 自动渲染写回的产物；因此该文件不会带 projector 元数据头。

## Distribution Paths

1. `official`：由产品官方维护的基础 pack，作为最低优先级基线进入 `StandardsPackRegistry`，建议固定较低 `mergePrecedence`（例如 `10`）。
2. `team`：由团队发布为独立 npm 包或内部 Git 源码包，消费方通过根入口导出 `StandardsPack` 对象接入 registry，建议位于 `official` 与 `repository` 之间（例如 `50`）。
3. `repository`：由目标仓库就地维护的 pack，承接仓库级覆盖规则，建议使用最高 `mergePrecedence`（例如 `100`）以覆盖 team / official 基线。
4. 当前代码基线的真实消费方式是“调用方显式组装 packs 后传给 `new StandardsPackRegistry({ packs })`”；`.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md` 中提到的 `governor.yaml.standards` 仍是后续运行时加载北极星，而不是当前仓库内已经落地的自动 loader。

最小示例：

```ts
import {
  AgentsProjector,
  RuleRenderer,
  StandardsPackRegistry,
  StandardsPackScope,
  StandardsPackSource,
  StandardsPackStatus,
  StandardsRenderTarget,
  StandardsRuleSeverity,
  type StandardsPack,
} from "@repo-ai-governor/standards";
import { officialBaselinePack } from "@acme/governor-standards-official";
import { teamDeliveryPack } from "@acme/governor-standards-team";

const repositoryOverridePack: StandardsPack = {
  packId: "pack.repo.delivery",
  packVersion: "1.0.0",
  packSource: StandardsPackSource.REPOSITORY,
  scope: StandardsPackScope.REPOSITORY,
  mergePrecedence: 100,
  status: StandardsPackStatus.ACTIVE,
  rules: [
    {
      ruleId: "rule.review.required.repo",
      semanticKey: "rule.review.required",
      severity: StandardsRuleSeverity.REQUIRED,
      enabled: true,
      localizedTemplates: {
        "zh-CN": {
          [StandardsRenderTarget.HUMAN]: "仓库策略要求在合并前完成 review。",
          [StandardsRenderTarget.AI]: "Repository policy requires review before merge.",
          [StandardsRenderTarget.AGENTS]: "Require repository review before merge.",
        },
        "en-US": {
          [StandardsRenderTarget.HUMAN]: "Repository policy requires review before merge.",
          [StandardsRenderTarget.AI]: "Repository policy requires review before merge.",
          [StandardsRenderTarget.AGENTS]: "Require repository review before merge.",
        },
      },
    },
  ],
};

const registry = new StandardsPackRegistry({
  packs: [officialBaselinePack, teamDeliveryPack, repositoryOverridePack],
});
const renderer = new RuleRenderer({
  registry,
});
const projector = new AgentsProjector({
  renderer,
});

const agentsProjection = projector.project({
  locale: "en-US",
});
```

推荐分发顺序：

1. 官方 pack：作为稳定基础 contract 发布，供所有 adopter 复用。
2. 团队 pack：以组织/团队维度独立发布，承接跨仓库协作规范。
3. 仓库 pack：与业务仓库一起演进，只保存该仓库的最终覆盖规则。

## Minimal Language Packs

`packages/standards` 现在内置两套可直接复用的最小语言治理模板：

1. `pythonMinimalGovernancePack`
   - 聚焦 `pyproject.toml`、`ruff format/check`、`pytest`、`pyright`
   - 适合作为 Python adopter 的最低可用 pack 基线
2. `goMinimalGovernancePack`
   - 聚焦 `go.mod/go.sum`、`go fmt ./...`、`go test ./...`、`go vet ./...`
   - 适合作为 Go adopter 的最低可用 pack 基线

最小示例：

```ts
import {
  StandardsPackRegistry,
  goMinimalGovernancePack,
  pythonMinimalGovernancePack,
} from "@repo-ai-governor/standards";

const registry = new StandardsPackRegistry({
  packs: [pythonMinimalGovernancePack, goMinimalGovernancePack],
});
```

说明：

1. 这两套模板仍遵循 `official -> team -> repository` layering 口径，不引入额外 loader。
2. 它们是“最小可用”产品化模板，而不是完整语言最佳实践全集；团队仍可在其上叠加自己的 team / repository overrides。
