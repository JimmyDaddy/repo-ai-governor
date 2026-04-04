# Repo AI Governor `review / review-verify` 产出、复核与台账回填契约（Draft）

- Status: draft
- Date: 2026-04-04
- Scope: service-owned review generation / structured findings / verification decision / review lifecycle artifact / ledger backfill
- Target Module IDs:
  - `runtime.orchestration`
  - `runtime.durable-storage`
  - `runtime.cli-interactive-shell`
- Implementation Surfaces:
  - `apps/cli`
  - `packages/core-orchestration-service`
  - `packages/shared`
- Related:
  - `.repo-ai-governor/draft/cli-capability-maturity-and-baseline-enhancement-priority-analysis.md`
  - `.repo-ai-governor/draft/session-main-capability-explainer-and-contextual-command-guidance-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/contracts/registry-and-ledger-projection-contract.md`
  - `apps/cli/src/commands/review-command.ts`
  - `apps/cli/src/commands/review-verify-command.ts`
  - `apps/cli/src/constants/cli-governance-runtime.constant.ts`

## 1. 背景与问题

当前 `review / review-verify` 仍停留在薄基线实现：

1. `review` 主要负责向 `context/review-queue/requests/` 写 queued request artifact。
2. `review-verify` 主要负责消费 queued request，并向 `context/review-queue/results/` 与 `context/ledger-backfill/review-verify/` 写结果 artifact。
3. 系统还没有正式完成以下用户预期：
   - 真实生成结构化 findings
   - 将 findings 落为正式 review lifecycle artifact
   - 在同一 review artifact 上完成 verify / resolved 闭环
   - 把 verify 结论有约束地回填到 sprint ledger

这意味着当前产品已经有 `review` 与 `review-verify` 入口，但还没有“会真实做 review，并把 review 闭环落到 review/台账真值”的正式能力。

## 2. 目标

本契约的目标是把 `review / review-verify` 定义为同一条治理闭环能力，而不是两个只会排队与回填 artifact 的占位命令。

具体目标：

1. `review` 能基于明确 scope 产出结构化 findings。
2. findings 必须投影到正式 review lifecycle artifact，而不是只停留在 queue artifact。
3. `review-verify` 必须消费 review artifact 与 findings，并给出明确的 verify 结论。
4. `review-verify` 产生的 task ledger backfill 必须是 review 真值的派生产物，而不是新的 canonical truth。
5. 对 task-aware review，系统应支持在 verify 完成后受控追加 checklist / tasks.csv / task card 执行记录。

## 3. 非目标

1. 不在第一阶段把 `review` 直接扩展成自动修复 accepted findings 的命令。
2. 不把 review queue artifact 继续包装成用户可见的正式结果。
3. 不绕过既有 `code_review -> verified_code_review -> resolved_code_review` 生命周期。
4. 不让 `review-verify` 伪造 review finding，只允许它消费既有 finding 并做验证结论。
5. 不把 `review / review-verify` 融成新的“大而全执行引擎”。

## 4. 归属判断

这个契约的 canonical owner 应是 `runtime.orchestration`，并通过 `runtime.durable-storage` 投影到 review artifact 与 task ledger。

原因：

1. review scope 解析、finding 结构、verify 决策与 lifecycle 状态，属于治理 runtime 的正式能力语义。
2. CLI shell 只负责展示 findings、verify 结论、blocking prompt 与 backlink，不应拥有 review truth。
3. `runtime.durable-storage` 负责把结论写到 review/ledger 真值，但不拥有“该 review 什么、finding 是否成立”的语义。

## 5. 理想中的用法

理想中的 `review / review-verify` 应是一条连续但分阶段的治理链路：

1. 用户发起 review：
   - 例如“review 当前 working tree”
   - 或“review TK-518 相关改动”
2. runtime 解析 scope：
   - working tree
   - 指定 task
   - 指定 review artifact 的 recheck
3. `review` 产出结构化 findings，并落成正式 `code_review_*.md`
4. 用户或策略链触发 `review-verify`
5. `review-verify` 在同一 artifact 上追加 `复核结论`
6. 若 accepted findings 后续被修复，再在同一 artifact 上追加 `修复执行记录`，并进入 `resolved_*`
7. 若 task-aware 且策略允许，再做受控 ledger backfill

## 6. 输入契约

### 6.1 有限集合与 i18n 治理

按 `CS-009` 与 `CS-033`，这里的 closed-set contract value 在正式实现时不应以内联 string-literal union 分散定义，也不应把中文展示文案直接写入 runtime truth。

建议边界：

1. runtime request / result / durable artifact 只存 machine-readable enum value，例如 `accepted`、`review_pending`、`not_requested`。
2. 所有有限集合都应集中沉淀到共享常量或 enum，例如 `packages/shared/src/constants/**` 或对应 runtime package 的 `src/constants/**`。
3. shell / presenter 若要展示 `认可 / 部分认可 / 不认可`、`待复核 / 已复核 / 已解决` 等文案，必须通过 i18n key 映射，而不是把展示文案当作 contract value。
4. 新增 user-facing label 时，应同步更新 `packages/shared/src/i18n/locales/en-us.ts` 与 `packages/shared/src/i18n/locales/zh-cn.ts`。

建议枚举与映射骨架如下：

```ts
enum SessionMainReviewMode {
  WORKING_TREE = 'working_tree',
  TASK_SCOPE = 'task_scope',
  EXPLICIT_PATHS = 'explicit_paths',
}

enum SessionMainReviewOutputIntent {
  ARTIFACT_ONLY = 'artifact_only',
  ARTIFACT_THEN_VERIFY = 'artifact_then_verify',
}

enum SessionMainReviewVerificationMode {
  RECHECK_ONLY = 'recheck_only',
  RECHECK_AND_RECORD = 'recheck_and_record',
}

enum SessionMainReviewSeverity {
  P0 = 'P0',
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3',
}

enum SessionMainReviewLifecycleStatus {
  REVIEW_PENDING = 'review_pending',
  VERIFIED = 'verified',
  RESOLVED = 'resolved',
}

enum SessionMainReviewVerifyDecision {
  ACCEPTED = 'accepted',
  PARTIALLY_ACCEPTED = 'partially_accepted',
  REJECTED = 'rejected',
}

enum SessionMainReviewLedgerBackfillStatus {
  NOT_REQUESTED = 'not_requested',
  PENDING = 'pending',
  APPLIED = 'applied',
  FAILED = 'failed',
}

const REVIEW_VERIFY_DECISION_I18N_KEYS: Record<SessionMainReviewVerifyDecision, string> = {
  [SessionMainReviewVerifyDecision.ACCEPTED]: 'cli.review.verifyDecision.accepted',
  [SessionMainReviewVerifyDecision.PARTIALLY_ACCEPTED]:
    'cli.review.verifyDecision.partiallyAccepted',
  [SessionMainReviewVerifyDecision.REJECTED]: 'cli.review.verifyDecision.rejected',
};

const REVIEW_ARTIFACT_STATUS_I18N_KEYS: Record<SessionMainReviewLifecycleStatus, string> = {
  [SessionMainReviewLifecycleStatus.REVIEW_PENDING]:
    'cli.review.artifactStatus.reviewPending',
  [SessionMainReviewLifecycleStatus.VERIFIED]: 'cli.review.artifactStatus.verified',
  [SessionMainReviewLifecycleStatus.RESOLVED]: 'cli.review.artifactStatus.resolved',
};

const REVIEW_SEVERITY_I18N_KEYS: Record<SessionMainReviewSeverity, string> = {
  [SessionMainReviewSeverity.P0]: 'cli.review.severity.p0',
  [SessionMainReviewSeverity.P1]: 'cli.review.severity.p1',
  [SessionMainReviewSeverity.P2]: 'cli.review.severity.p2',
  [SessionMainReviewSeverity.P3]: 'cli.review.severity.p3',
};
```

建议最小请求结构如下：

```ts
interface SessionMainReviewRequest {
  requestId: string;
  reviewMode: SessionMainReviewMode;
  targetStreamId: string;
  targetProjectId: string;
  targetSprintId: string;
  requestedTaskId?: string;
  targetPaths?: string[];
  sourceTurnId: string;
  outputIntent: SessionMainReviewOutputIntent;
}

interface SessionMainReviewVerifyRequest {
  verifyId: string;
  sourceReviewArtifactPath: string;
  requestedTaskId?: string;
  verificationMode: SessionMainReviewVerificationMode;
  acceptedFindingIds?: string[];
  sourceTurnId: string;
}
```

约束建议：

1. 默认 review 输出路径必须来自 `.repo-ai-governor/context/current-context.md` 解析出的 review 目录。
2. 若 scope 不明确，runtime 必须先要求补充 scope，而不是盲目 review 全仓库。
3. `review-verify` 不得在没有 source review artifact 的情况下凭空执行。
4. task-aware verify 只有在 `task_id` 可可靠解析时才允许 ledger backfill。

## 7. 输出契约

### 7.1 `review`

```ts
interface SessionMainReviewFinding {
  findingId: string;
  severity: SessionMainReviewSeverity;
  title: string;
  file: string;
  line?: number;
  summary: string;
  impact: string;
  suggestedAction: string;
}

interface SessionMainReviewResult {
  reviewId: string;
  reviewArtifactPath: string;
  reviewStatus: SessionMainReviewLifecycleStatus;
  scopeSummary: string;
  findings: SessionMainReviewFinding[];
  notes: string[];
}
```

### 7.2 `review-verify`

```ts
interface SessionMainReviewVerifyResult {
  verifyId: string;
  sourceReviewArtifactPath: string;
  overallDecision: SessionMainReviewVerifyDecision;
  acceptedFindingIds: string[];
  rejectedFindingIds: string[];
  ledgerBackfillStatus: SessionMainReviewLedgerBackfillStatus;
  reviewArtifactStatus: SessionMainReviewLifecycleStatus;
}
```

补充约束：

1. `SessionMainReviewResult.reviewStatus` 在 `review` 阶段只允许使用 `review_pending | resolved` 子集。
2. `SessionMainReviewVerifyResult.reviewArtifactStatus` 在 `review-verify` 阶段只允许使用 `verified | resolved` 子集。
3. `overallDecision` 的 contract truth 应存 `accepted | partially_accepted | rejected`，由 shell 再通过 i18n 渲染为 `认可 / 部分认可 / 不认可` 等本地化文案。

## 8. Review artifact 生命周期

正式真值必须是 sprint review 目录中的 lifecycle artifact，而不是 queue artifact。

推荐规则：

1. `review` 若发现 actionable findings，应生成 `code_review_<slug>.md`
2. `review` 若无 actionable findings，应直接生成 `resolved_code_review_<slug>.md`
3. `review-verify` 必须在同一文件上追加 `## 复核结论（YYYY-MM-DD）`
4. 所有 actionable item 完成后，才允许进入 `resolved_*`
5. `review / verify / resolved` 的文件名前缀与 `Status` 字段必须保持同步

额外约束：

1. queue artifact 只是 transport / diagnostics，不是 review truth
2. review truth 高于 ledger backfill truth
3. ledger backfill 失败时，不能倒推说 review 本身不存在

## 9. Ledger backfill 规则

### 9.1 总原则

ledger backfill 只能作为 review 真值的派生投影，不得成为 review 生命周期的替代来源。

### 9.2 写入范围

当 task-aware review verify 成功后，允许回填：

1. `tasks/checklist.md`
2. `tasks/tasks.csv`
3. `tasks/TK-xxx.md`

### 9.3 写入约束

1. 只能追加与 verify / resolved 相关的执行记录
2. 不得伪造 review findings 本体到 task ledger
3. 不得把 queue artifact path 当作正式 review 证据路径
4. `review_delta` 字段应指向 review lifecycle artifact，而不是 request queue artifact

## 10. 与现有实现的关系

当前实现大致是：

1. `review` 写 queued request artifact
2. `review-verify` 消费 queued request
3. `review-verify` 生成 verify/backfill artifact，并在 task-aware 场景下尝试自动 ledger backfill

这些 artifact 可以在过渡期保留，但应降级为：

1. transport artifact
2. diagnostics artifact
3. downstream retry / replay input

它们不应继续被当作正式 review truth。

## 11. 边界规则

### 11.1 与 code review workflow 的边界

1. `review / review-verify` command capability 定义的是产品能力语义。
2. workspace-local CR skill 定义的是当前仓库的执行工作流。
3. 前者未来可以复用后者的一部分 artifact 生命周期，但不能直接把 skill 语义当作产品 contract。

### 11.2 与修复动作的边界

1. `review` 负责产出 finding。
2. `review-verify` 负责验证、结论与回填。
3. accepted findings 的修复执行可以由后续能力接管，但不是本契约第一阶段的强制内容。

### 11.3 与 shell 的边界

1. shell 只渲染 scope、finding summary、verify decision、backlink 和 pending action。
2. shell 不拥有 review file naming、finding id allocation 或 ledger backfill truth。

## 12. 分阶段实现建议

### Phase A

把 `review` 从 queue-only 提升为真实 findings artifact：

1. 生成结构化 findings
2. 写正式 `code_review_*.md`
3. queue artifact 退化为 transport-only

### Phase B

把 `review-verify` 从 queue consumer 提升为真实 lifecycle 迁移：

1. 在同一 review artifact 上追加 verify 结论
2. 维护 `verified_* / resolved_*` 生命周期
3. 给出 accepted / rejected finding 结果

### Phase C

补齐 task-aware ledger backfill：

1. 按 accepted / resolved 结果回填 checklist / tasks.csv / task card
2. 保持 review truth 高于 ledger truth
3. 支持失败回退与重试

## 13. 与 CLI 能力成熟度分析 draft 的关系

这份 draft 是
`.repo-ai-governor/draft/cli-capability-maturity-and-baseline-enhancement-priority-analysis.md`
中 `review / review-verify` 薄基线判断的专项 follow-up。

两者分工如下：

1. 分析文回答：为什么 `review / review-verify` 是战略优先级第一的补强程序。
2. 本文回答：既然决定补这条链，第一批 contract 到底该补哪些状态、artifact truth 与 ledger backfill 边界。

立项时建议至少核对：

1. 这次项目是只补 `review` finding 生成，还是补到 `review-verify` lifecycle 迁移。
2. review truth 是否明确落在 lifecycle artifact，而不是 queue artifact。
3. ledger backfill 是否仍被约束为派生投影，而不是新的 canonical source。
4. 是否避免把“review、verify、fix、delivery”一次性塞成一个过大的项目。

## 14. 最终建议

`review / review-verify` 的理想形态应是：

1. `review` 生成结构化 findings
2. findings 落为正式 review lifecycle artifact
3. `review-verify` 在同一 artifact 上给出 verify / resolved 结论
4. ledger backfill 只做派生投影

这样产品才会从“会排队 review 请求”走向“会完成 review 治理闭环”。
