# Repo AI Governor 当前优先级待办（Draft）

- Status: draft
- Date: 2026-04-05
- Owner: AI-Agent
- Scope: 基于当前仓库代码面、支持矩阵、PRD、delivery registry 与执行上下文，对“接下来最值得继续补齐的缺口”做一份项目级优先级收敛。
- Related Inputs:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
  - `docs/support-matrix.md`
  - `docs/ga-readiness-evidence.zh-CN.md`
  - `apps/desktop/README.md`
  - `packages/standards/README.md`
  - `packages/adapters/local-model/README.md`

## 1. 结论先行

当前仓库的主要问题不是“代码已经跑不动”，而是“产品与治理上仍有几块明确未收口的缺口”。

本轮核对中，以下验证信号已通过：

1. `pnpm run check:fast`
2. `pnpm run build`
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`

因此，后续优先级应以“收口产品边界、修正治理真值、补强正式支持口径”为主，而不是先做纯救火式稳定性修复。

## 2. P0：必须先收口

### 2.1 治理台账与执行上下文真值统一

优先级：`P0`

问题：

1. `current-context.md` 当前仍把 `project-044 / sprint-003` 挂为 active closeout surface。
2. `Planned Follow-Up Streams` 为空，但 delivery registry 仍存在 `followup_required + rollout_status: planned` 的 user-facing solution。
3. `project-038` 顶层仍是 `Status: active`，但已列出的 sprint 全部是 `completed`。
4. `project-041` 的 sprint 条目仍写着 `Status: active`，但 task package 已全部完成并已有 completion audit。

建议动作：

1. 选定真正的下一条 `primary` stream。
2. 将已完成 project/sprint 从临时 closeout surface 迁入 completed history。
3. 对齐 `current-context.md`、project/sprint `plan.md`、delivery registry 的 planned/completed 真值。

理由：

如果真值不统一，后续所有“还剩哪些没做”的判断都会持续被噪音污染。

## 3. P1：最值得继续推进的产品缺口

### 3.1 Desktop `artifact pane` query contract 收口

优先级：`P1`

当前状态：

1. `apps/desktop` 只完成 `Phase 0 + Phase 1` foundation。
2. `artifact pane` 仍是 gated deferred state。
3. support matrix 也明确当前 desktop 只是 smoke baseline，不是完整产品面。

建议动作：

1. 补齐 service-owned `artifact/review/transcript query` contract。
2. 让 desktop renderer 通过 typed seam 正式消费该 contract。
3. 保持“不允许 filesystem bypass”这条边界不变。

理由：

这是桌面端最明确、也最影响“从 foundation 走向可用产品面”的缺口。

### 3.2 Adapter 正式支持矩阵补强

优先级：`P1`

当前状态：

1. support matrix 里 `codex` 是 primary fixture-backed route。
2. `github-copilot`、`claude-code` 仍是 conditional / warning-driven 口径。
3. `adapter-local-model` 已有实现，但还没有进入正式支持矩阵。
4. `adapter-local-model` 自身也明确保守口径，不将 `tool_calling`、`structured_output`、`confirmation_gate` 误报为完整实现。

建议动作：

1. 把 `github-copilot`、`claude-code` 从“条件化 smoke 支持”往更稳定的正式支持推进。
2. 明确 `local-model` 的产品定位：
   - 要么进入 support matrix 并补 smoke/evidence
   - 要么继续保持实验/保守口径，并在对外文档里说清楚

理由：

这直接影响 PRD 中“多模型统一适配层 / 多工具适配”的真实完成度。

### 3.3 Standards Pack 从库能力走向运行时自动消费

优先级：`P1`

当前状态：

1. `packages/standards` 已具备 `StandardsPackRegistry`、`RuleRenderer`、`AgentsProjector`、`StandardsUpgradePlanner`。
2. 但 README 明确写了：根级 `AGENTS.md` 仍是手工维护；`governor.yaml.standards` 仍是后续运行时加载北极星，不是当前已落地能力。

建议动作：

1. 设计并落地 standards runtime loader。
2. 明确 `official / team / repository` pack 的自动装配方式。
3. 视窗口决定是否让 root `AGENTS.md` 正式接入 projector 产物链。

理由：

这项能力一旦补齐，团队级共享规范包与多视图一致性才能从“库能力”升级为“真实产品能力”。

### 3.4 P1 CI 模板补齐

优先级：`P1`

当前状态：

1. PRD 明确要求 P1 补齐 `GitLab CI` 与 `Jenkins` 官方模板。
2. 当前仓库内只看到 GitHub Actions workflow：
   - `.github/workflows/quality-gate.yml`
   - `.github/workflows/release-governance.yml`
3. 未看到 GitLab / Jenkins / Azure Pipelines / CircleCI 模板资产。

建议动作：

1. 先补 `GitLab CI` 与 `Jenkins` 的最小官方模板。
2. 模板内容至少覆盖 install、quality gate、release governance 的基础调用链。
3. `Azure Pipelines` 与 `CircleCI` 维持后续 `P2` 规划项。

理由：

这是 PRD 中写得最明确、也最容易对外形成“是否真正多 CI 支持”的差距。

### 3.5 GA readiness 最后一个 conditional 收口

优先级：`P1`

当前状态：

1. `GA readiness` 现为 `10 / 11 Pass + 1 Conditional pass`。
2. 唯一条件项是“试点仓库 15 分钟内完成 `install -> init -> doctor -> check`”尚未固化为统一量化指标行。

建议动作：

1. 为试点仓库补统一的 onboarding timing record。
2. 将耗时统计接入现有 evidence 文档或脚本输出。

理由：

这是距离“GA readiness 证据闭环”最近的一项尾项，投入小、信号价值高。

## 4. P2：后续深化项

### 4.1 Desktop 完整产品面

优先级：`P2`

在 `artifact pane` contract ready 之后，继续把 desktop 从 foundation/smoke baseline 推进到更完整的 desktop governance console 产品面。

补充决策参考：

1. 方案决策与竞品对标见 `.repo-ai-governor/draft/repo-ai-governor-desktop-complete-product-surface-benchmark-and-decision.md`。

### 4.2 平台化能力

优先级：`P2`

继续推进 PRD 中的规划项：

1. 插槽市场/共享机制
2. 可视化配置与执行面板
3. 组织级审计与指标看板
4. 云端同步与策略分发

## 5. 推荐执行顺序

建议按以下顺序推进：

1. 先清治理真值：
   - `current-context`
   - delivery registry
   - 已完成 project/sprint 状态
2. 再推一个用户面主线：
   - desktop `artifact pane` contract
   - 或 adapter 正式支持矩阵
3. 再补对外完备性：
   - standards runtime loader
   - GitLab/Jenkins 模板
   - GA readiness 最后一个 conditional

## 6. 备注

1. 本文是“当前优先级待办”草案，不替代 PRD、technical solution 或正式 project plan。
2. 若下一步决定正式执行其中某项，应再拆成 `project / sprint / task package`，并同步 `current-context.md` 与对应台账。
