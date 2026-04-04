# Repo AI Governor CLI 能力成熟度与 Baseline 补强优先级分析（Draft）

- Status: draft
- Date: 2026-04-04
- Scope: CLI command maturity / baseline capability prioritization / capability enhancement ROI
- Related:
  - `.repo-ai-governor/draft/session-main-plan-generation-and-ledger-commit-contract.md`
  - `.repo-ai-governor/draft/session-main-review-generation-verification-and-ledger-backfill-contract.md`
  - `.repo-ai-governor/draft/upgrade-analysis-apply-and-rollback-contract.md`
  - `apps/cli/README.md`
  - `apps/cli/src/commands/plan-command.ts`
  - `apps/cli/src/commands/review-command.ts`
  - `apps/cli/src/commands/review-verify-command.ts`
  - `apps/cli/src/commands/upgrade-command.ts`
  - `apps/cli/src/commands/init-command.ts`
  - `apps/cli/src/commands/run-command.ts`
  - `apps/cli/src/commands/connect-command.ts`
  - `apps/cli/src/commands/doctor-command.ts`
  - `apps/cli/src/commands/verify-command.ts`
  - `apps/cli/src/commands/workflow-command.ts`
  - `apps/cli/src/commands/workspace-command.ts`

## 1. 核心结论

当前 CLI 虽然整体仍处于 `baseline` 状态，但内部成熟度已经明显分层，不能再把所有命令视为同一成熟度水平。

最像 `plan` 这类“已接入产品面、但实现仍偏最小可执行边界”的能力，主要是：

1. `plan`
2. `review`
3. `review-verify`
4. `upgrade`

其中：

1. `plan` 当前主要是写入 plan snapshot artifact。
2. `review` 当前主要是排队 review request artifact，而不是真实执行 review 产出。
3. `review-verify` 当前主要是消费队列、写 verify/backfill artifact，而不是真正完成 review 闭环验证。
4. `upgrade` 当前是 analyze-only，产出 diff / candidate / rollback snapshot，但不直接 apply。

而 `connect / doctor / check / verify / workflow / workspace` 已经明显超出这类薄基线实现，属于“相对成熟但仍在 baseline 产品阶段”的能力。

## 2. 分析口径

本分析使用两套不同排序逻辑：

1. `产品价值 / 实现成本` 排序：
   - 目标是看“下一笔投入最划算投在哪里”。
   - 偏向 ROI 和短中期收益。
2. `baseline 能力补强顺序`：
   - 目标是看“为了让产品主线更完整，应该先补哪条能力链”。
   - 偏向战略闭环完整性，而不是纯 ROI。

因此，两张排序表不必完全一致。

## 3. 当前 CLI 能力成熟度分层

| 能力 | 当前层级 | 当前真实能力 | 当前主要缺口 |
|---|---|---|---|
| `plan` | 薄基线 | 生成 `context/plan/plan-*.json` snapshot artifact | 未做真正任务拆解、未同步 `plan.md/checklist/tasks.csv/TK-xxx` |
| `review` | 薄基线 | 写 queued review request artifact，接入 orchestration execution 记录 | 未真实执行 reviewer 流并产出 findings |
| `review-verify` | 薄基线 | 消费 queued request，写 verify / ledger-backfill artifact | 未形成真实 review 验证闭环与结论消费路径 |
| `upgrade` | 薄基线 | analyze schema diff，生成 `report / auto-migrated-config / rollback-snapshot` | 未完成 controlled apply 与升级后验证 |
| `init` | 基线可用 | 建 workspace/config/bootstrap manifest，支持最小交互 bootstrap | onboarding 仍较薄，provider/setup 引导不足 |
| `run` | 基线可用 | 已接入最小 `compiler -> runtime -> policy -> audit -> report` 链路 | 与完整 delivery / HITL / recovery 闭环仍有距离 |
| `connect` | 相对成熟 | 生成 candidate config、diff、merge explain，并对 candidate 做 adapter verification | apply/cutover 体验仍可继续深化 |
| `doctor` | 相对成熟 | 做 workspace/config/memory baseline 检查与 safe-local fix，可接 adapter verification | 自动修复边界仍偏保守 |
| `check` | 相对成熟 | 真实执行治理脚本并汇总门禁结果 | external adopter 体验仍偏生硬 |
| `verify` | 相对成熟 | 产出 onboarding contract、matrix、agent view、durable storage 诊断 | 仍偏 readiness/diagnostics，而非真实运行保证 |
| `workflow` | 相对成熟 | `preview/create/edit`，可保存 definition 和 compiled IR | editor / visualization / lifecycle 还可继续深化 |
| `workspace` | 相对成熟 | `dry-run/execute/rollback` 工作区迁移链路已具备 | 大规模 adopter 场景下的 DX 仍可继续打磨 |

### 3.1 薄基线命令的专项 contract 覆盖

为避免后续立项时只记得“这几个命令还薄”，却忘了“各自 follow-up contract 在哪”，建议把当前薄基线命令的专项 draft 覆盖固定为：

| 命令 | 当前专项 draft | 备注 |
|---|---|---|
| `plan` | `.repo-ai-governor/draft/session-main-plan-generation-and-ledger-commit-contract.md` | 已补齐 preview / explicit confirm / ledger commit 边界 |
| `review / review-verify` | `.repo-ai-governor/draft/session-main-review-generation-verification-and-ledger-backfill-contract.md` | 两个命令视为同一治理闭环程序，不建议拆成互相独立的两份 contract |
| `upgrade` | `.repo-ai-governor/draft/upgrade-analysis-apply-and-rollback-contract.md` | 以 analyze/apply/rollback 三段式收口 |

这意味着：

1. 当前“最像 `plan` 一样仍偏薄基线”的命令，已经都有对应的 follow-up contract draft。
2. 后续若新起 `plan / review / review-verify / upgrade` 项目，默认应先联读“成熟度分析 + 对应专项 contract”，而不是只看命令源码。

## 4. 按“产品价值 / 实现成本”排序

这里排序的对象，不是“命令本身”，而是“下一轮值得投资的补强程序”。

### 4.1 排序结果

| 顺序 | 补强对象 | 产品价值 | 实现成本 | 排序理由 |
|---|---|---|---|---|
| 1 | `upgrade` 从 analyze-only 走向 controlled apply | 高 | 中 | 现有 diff/candidate/rollback 基础已经存在，继续补 apply 与验证链路的边际收益高、范围相对可控 |
| 2 | `plan` 从 snapshot 走向真实 task breakdown | 中 | 低-中 | 当前壳层入口与 session.main 路由已存在，补强成本相对可控，能明显提升“会话里真能规划任务”的体感 |
| 3 | `review / review-verify` 从 artifact queue 走向真实治理闭环 | 很高 | 高 | 产品主线价值最高，但需要一次性补齐 reviewer 产出、verify 消费、生命周期与结果契约，工程跨度更大 |
| 4 | `init` 从最小 bootstrap 走向 richer onboarding | 中 | 中 | 用户价值稳定，但已有 `connect / doctor / verify` 分担大量 onboarding 压力，优先级可后置 |
| 5 | `run` 从最小执行链路走向 production-grade loop | 很高 | 很高 | 价值很高，但当前已不是薄基线；继续深化会牵动范围更广，不适合作为短期 ROI 最高项 |

### 4.2 排序说明

#### 1) 为什么 `upgrade` 是 ROI 第一

因为它已经有：

1. schema diff
2. auto migrated candidate
3. rollback snapshot

也就是说，最难的“分析面”已经存在，补强重点主要落在：

1. apply 动作
2. confirmation gating
3. apply 后验证
4. rollback 操作体验

这是一条边界清晰、收益直接、对 adopter 友好的补强路径。

#### 2) 为什么 `plan` 在 ROI 上高于 `review / review-verify`

不是因为 `plan` 更重要，而是因为：

1. `plan` 的当前缺口更集中
2. 现有入口已经打通到 session.main `/plan`
3. 产出目标更单纯，容易定义 MVP

相比之下，`review / review-verify` 需要同时解决：

1. review request 的真实执行
2. findings 结构
3. verify 结论
4. ledger / lifecycle / artifact 一致性

因此它的价值更高，但 ROI 不一定最高。

## 5. Baseline 能力最值得优先补强的顺序

这一节不是按 ROI，而是按“产品主线闭环价值”排序。

### 5.1 推荐顺序

| 顺序 | 能力 | 推荐级别 | 原因 |
|---|---|---|---|
| 1 | `review / review-verify` | 最高 | 这条链直接决定治理产品是不是只停留在“执行前检查”，还是已经具备“执行后审查与验证闭环” |
| 2 | `upgrade` | 很高 | 决定配置演进是否真正可控，关系到 adopter 长期升级安全性 |
| 3 | `plan` | 高 | 决定 session.main 的“规划”是不是实义能力，而不是 artifact-only 占位能力 |
| 4 | `run` | 中高 | 继续深化当然重要，但它当前已经具备最小可执行链路，不是最空的一环 |
| 5 | `init` | 中 | 当前已有最小 bootstrap 且有 `connect / doctor / verify` 分担，因此不是最急迫的薄弱面 |

### 5.2 为什么战略优先级里 `review / review-verify` 要排第一

原因不在于它最便宜，而在于它最“产品化核心”。

Repo AI Governor 的主线不是单纯执行命令，而是：

1. 能编排
2. 能治理
3. 能审查
4. 能验证
5. 能留审计链

在这条主线上：

1. `plan` 重要，但没有 `review / review-verify`，产品会更像“执行助手”。
2. `review / review-verify` 补齐后，产品才更像“治理系统”。

所以如果只能优先补一条战略主线，应优先补 `review / review-verify`。

## 6. 具体建议：如果只能做一件事

### 情况 A：只允许做一项“高 ROI 补强”

优先做：

1. `upgrade`

理由：

1. 现有基础最完整
2. 补强边界清晰
3. adopter 感知收益直接
4. 风险相对可控

### 情况 B：只允许做一项“主线战略补强”

优先做：

1. `review / review-verify`

理由：

1. 它最能补齐治理闭环
2. 它最能把产品从“能跑”推向“能治理”
3. 它对 product narrative 的提升最大

## 7. 推荐的近期执行顺序

如果允许按两段式推进，推荐顺序如下：

### Phase 1：高 ROI 收益

1. `upgrade`
2. `plan`

### Phase 2：主线闭环补强

3. `review / review-verify`

### Phase 3：已有基线能力深化

4. `run`
5. `init`

这个顺序的好处是：

1. 先用较小投入拿到可见产品收益
2. 再集中资源处理跨度更大的治理闭环能力
3. 避免一开始就进入高复杂度、大范围改造

## 8. 对后续设计的约束建议

### 8.1 `plan`

建议的下一个最小目标：

1. 输出结构化 task breakdown
2. 能明确主步骤、风险、验证点
3. 能选择性同步到工作区 ledger，而不是一上来就耦合所有台账

进一步约束建议：

1. `plan` 的具体 contract、preview/confirm/commit 状态和 ledger projection 边界，应以
   `.repo-ai-governor/draft/session-main-plan-generation-and-ledger-commit-contract.md`
   为 plan 专项 follow-up draft。
2. 本文回答“为什么 `plan` 值得补、在所有 baseline 能力里排第几”，而专项 contract 回答“第一批到底该补成什么样、不能越界到哪里”。
3. 后续只要起的是 `plan` 相关项目，默认应把这两份 draft 联读，而不是只看其中一篇。

### 8.2 `review / review-verify`

建议把二者视为一个补强程序，而不是两个独立散点命令。

最小闭环应至少包括：

1. `review` 产出结构化 findings
2. `review-verify` 消费 findings 并给出验证结论
3. artifact lifecycle 和结果状态一致

进一步约束建议：

1. `review / review-verify` 的专项 contract 应以
   `.repo-ai-governor/draft/session-main-review-generation-verification-and-ledger-backfill-contract.md`
   为统一 follow-up draft。
2. 这条契约应先明确 review artifact truth、verify lifecycle 与 ledger backfill 边界，再讨论更后面的自动修复或 delivery handoff。
3. 后续立项时，默认应把 `review` 与 `review-verify` 视为同一项目程序，而不是分开各起一条散点任务流。

### 8.3 `upgrade`

建议保持“先 analyze、再 apply”的双阶段模型，不要直接把 analyze-only 改成隐式写回。

进一步约束建议：

1. `upgrade` 的专项 contract 应以
   `.repo-ai-governor/draft/upgrade-analysis-apply-and-rollback-contract.md`
   为 follow-up draft。
2. 后续项目应优先补齐 `preview + explicit confirm + controlled apply + rollback`，而不是直接把当前 analyze-only 路径改成隐式写回。

### 8.4 `run`

建议继续保持“最小链路已可用”的前提，不要在补强 `review / upgrade / plan` 之前，把 `run` 扩展成新的大范围吸纳口。

## 9. 与 `session.main` 规划契约 draft 的关系

为了避免后续立项时只记得“`plan` 要补强”，却忘了“补强到什么边界”，建议把两篇 draft 固定理解为：

1. 本文是 `plan` 补强的上游优先级判断。
2. `.repo-ai-governor/draft/session-main-plan-generation-and-ledger-commit-contract.md`
   是 `plan` 补强的下游契约落地稿。

两者分工如下：

1. 本文定义：
   - `plan` 为什么仍属于薄基线能力
   - 为什么它的 ROI 排在 `upgrade` 之后、但仍值得优先补
   - 为什么它不应和 `review / review-verify / run` 混成一个大项目
2. 专项 contract 定义：
   - `plan preview`
   - `explicit confirm`
   - `ledger commit`
   - `active stream / follow-up stream` 的提交边界
   - `plan.md / checklist.md / tasks.csv / TK-xxx.md` 的投影规则

后续如果要新起 `plan` 项目，建议在立项说明里至少显式核对以下 4 点：

1. 当前项目目标是否明确限定为 `plan`，而不是顺手扩展成 `review / review-verify` 或新的 workflow planner。
2. 当前阶段是做 `preview only`，还是进入 `preview + explicit confirm + ledger commit`。
3. sprint ledger 的写入边界，是否仍然遵循专项 contract 里的 canonical truth 与 active stream 规则。
4. 项目验收时，是否同时满足本文的“补强优先级定位”和专项 contract 的“实现边界”。

## 10. 薄基线命令 contract 补强后的立项提醒

如果后续继续围绕这批薄基线命令起项目，建议默认采用下面的输入组合：

1. `plan`：成熟度分析文 + `session-main-plan-generation-and-ledger-commit-contract.md`
2. `review / review-verify`：成熟度分析文 + `session-main-review-generation-verification-and-ledger-backfill-contract.md`
3. `upgrade`：成熟度分析文 + `upgrade-analysis-apply-and-rollback-contract.md`

最容易遗漏的点有三类：

1. 只看到“命令当前很薄”，却没看到专项 contract 已经限定了第一批实现边界。
2. 只看专项 contract，忘了它在 ROI 与战略优先级里排第几。
3. 把 `review / review-verify / upgrade / run` 混成一个过大的跨命令项目。

## 11. 最终结论

如果从“当前哪些能力最像 `plan` 一样还是 baseline”来看，结论是：

1. `plan`
2. `review`
3. `review-verify`
4. `upgrade`

如果从“按产品价值 / 实现成本排序”来看，建议顺序是：

1. `upgrade`
2. `plan`
3. `review / review-verify`
4. `init`
5. `run`

如果从“baseline 能力最值得优先补强的顺序”来看，建议顺序是：

1. `review / review-verify`
2. `upgrade`
3. `plan`
4. `run`
5. `init`

这两套顺序不冲突：

1. 前者回答“哪里最划算”
2. 后者回答“哪里最关键”
