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
4. 当前代码基线同时支持两条真实消费路径：
   - 调用方显式组装 packs 后传给 `new StandardsPackRegistry({ packs })`
   - 通过 `governor.yaml.standards` + `StandardsRuntimeLoader` 自动装配 runtime registry/render/projector

## Runtime Loader

`packages/standards` 现在补齐了 `StandardsRuntimeLoader`，用于把 `governor.yaml.standards` 从“规划中的配置模型”推进成真实运行时装配链：

1. 按 `official / team / repository` 三层 source group 动态加载 pack module。
2. 校验每个 pack 的 `packSource` 与声明层级一致，避免把 repository override 误挂到 official layer。
3. 自动组装 `StandardsPackRegistry -> RuleRenderer -> AgentsProjector`。
4. `renderConfiguredTargets()` 按 `renderTargets` 声明顺序返回 `human/ai/agents` 渲染结果，供 CLI / docs / runtime surfaces 直接消费。
5. `projectAgents()` 按 `projectionTargets` 声明顺序返回投影 payload，但不自动写文件；调用方自行决定是否以及写到哪里。
6. 若未显式声明 `projectionTargets`，默认回落到 `AGENTS.md`。

典型 `governor.yaml.standards`：

```yaml
standards:
  packSources:
    official:
      - module: "@repo-ai-governor/standards/examples"
        exportName: "workflowReviewGovernancePack"
    team:
      - module: "@acme/governor-standards-team"
        exportName: "teamDeliveryPack"
    repository:
      - module: "./.repo-ai-governor/standards/repository-pack.ts"
        exportName: "repositoryOverridePack"
  renderTargets:
    - human
    - ai
  projectionTargets:
    - targetFile: ".repo-ai-governor/generated/AGENTS.generated.md"
      locale: en-US
  defaultLocale: zh-CN
  fallbackLocale: en-US
```

Runtime 消费示例：

```ts
import { writeFile } from "node:fs/promises";
import { ConfigLoader } from "@repo-ai-governor/config";
import { StandardsRuntimeLoader } from "@repo-ai-governor/standards";
import { dirname } from "node:path";

const configLoader = new ConfigLoader();
const configPath = "/workspace/.repo-ai-governor/governor.yaml";
const repoRoot = process.cwd();
const config = configLoader.loadFromFile(configPath);

const standardsLoader = new StandardsRuntimeLoader();
const runtime = await standardsLoader.load({
  baseDirectory: repoRoot,
  standards: config.standards,
});

const renderedTargets = await standardsLoader.renderConfiguredTargets({
  baseDirectory: repoRoot,
  standards: config.standards,
});
const agentsProjections = await standardsLoader.projectAgents({
  baseDirectory: repoRoot,
  standards: config.standards,
});

for (const projection of agentsProjections) {
  await writeFile(projection.projectionTarget, projection.projectedContent, "utf8");
}
```

消费边界说明：

1. `baseDirectory` 是 runtime 的相对路径解析根；相对 `packSources.*.module` 与相对 `projectionTargets[].targetFile` 都会解析到这个根下。
2. `runtime.loadedPacks` 暴露每个 pack 的 `layer/module/exportName` provenance，可直接用于 truth/debug/audit。
3. `renderConfiguredTargets()` 只返回结构化渲染结果，不负责 docs/CLI 文件写入。
4. `projectAgents()` 只返回 `projection_target/projected_at/source_pack_refs` 完整 payload，不自动写 root `AGENTS.md`；文件写入由调用方负责。
5. 当前仓库根级 `AGENTS.md` 仍是手工维护的治理入口，不是 runtime loader 的自动产物。

## Manual Composition Example

如果调用方已经在自己的发布链中显式管理 official/team/repository packs，也可以绕过 runtime loader，直接手动组装：

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

## Built-in Governance Packs

`packages/standards` 现在内置三套可直接复用的治理模板：

1. `workflowReviewGovernancePack`
   - 聚焦 `CR-xxx` 评审任务卡、`review_pending -> verified -> resolved` 生命周期，以及 review 文档与任务台账同步
   - 适合作为 adopter 面向用户工具治理流程里的 review 基线
2. `pythonMinimalGovernancePack`
   - 聚焦 `pyproject.toml`、`ruff format/check`、`pytest`、`pyright`
   - 适合作为 Python adopter 的最低可用 pack 基线
3. `goMinimalGovernancePack`
   - 聚焦 `go.mod/go.sum`、`go fmt ./...`、`go test ./...`、`go vet ./...`
   - 适合作为 Go adopter 的最低可用 pack 基线

最小示例：

```ts
import {
  StandardsPackRegistry,
  goMinimalGovernancePack,
  pythonMinimalGovernancePack,
  workflowReviewGovernancePack,
} from "@repo-ai-governor/standards";

const registry = new StandardsPackRegistry({
  packs: [
    workflowReviewGovernancePack,
    pythonMinimalGovernancePack,
    goMinimalGovernancePack,
  ],
});
```

说明：

1. `workflowReviewGovernancePack` 用于把 `CR-xxx` 评审任务卡语义带到 adopter-facing 治理流程；建议与任一语言 pack 叠加使用。
2. 这三套模板仍遵循 `official -> team -> repository` layering 口径，并可作为 `StandardsRuntimeLoader` 的官方 pack 输入。
3. 它们是“最小可用”产品化模板，而不是完整语言或流程最佳实践全集；团队仍可在其上叠加自己的 team / repository overrides。
