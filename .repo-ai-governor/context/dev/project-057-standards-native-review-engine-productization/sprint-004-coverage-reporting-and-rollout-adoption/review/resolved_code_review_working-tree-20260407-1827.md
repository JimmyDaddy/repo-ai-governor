# Code Review: sprint-004-coverage-reporting-and-rollout-adoption

- Status: resolved
- Date: 2026-04-07
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: delegated sprint review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `apps/cli/src/runtime/review/cli-hybrid-review-runtime.ts`
2. `apps/cli/src/commands/review-command.ts`
3. `apps/cli/src/constants/cli-review.constant.ts`
4. `apps/cli/src/types/interfaces/cli-review-command.interface.ts`
5. `apps/cli/test/runtime/cli-hybrid-review-runtime.test.ts`
6. `apps/cli/test/commands/review-command.test.ts`
7. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/plan.md`
8. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-004-coverage-reporting-and-rollout-adoption/plan.md`
9. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-004-coverage-reporting-and-rollout-adoption/tasks/TK-633-add-review-rule-coverage-metrics-and-provenance-aware-reporting-surface.md`
10. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-004-coverage-reporting-and-rollout-adoption/tasks/TK-634-define-delegated-review-activation-policy-for-deterministic-coverage-incomplete.md`
11. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-004-coverage-reporting-and-rollout-adoption/tasks/TK-635-complete-project-057-rollout-handoff-adoption-evidence-and-closeout-baseline.md`
12. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-004-coverage-reporting-and-rollout-adoption/tasks/DA-635-project-057-rollout-handoff-and-adoption-evidence-baseline.md`
13. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 2. Findings
### 2.1 [P2] Manual-only rules are double-counted as residual gaps
- 位置: `apps/cli/src/runtime/review/cli-hybrid-review-runtime.ts:78`
- 问题描述: `residualGapRuleIds` 先收集了所有未被 deterministic 或 standards-guided 覆盖的规则，随后 `manualOnlyGapRuleIds` 又从这个集合里切出 `MANUAL_ONLY` 子集并单独发布为另一类 bucket。这样在首个 `MANUAL_ONLY` 规则进入 phase-A bundle 后，同一个 rule id 会同时出现在 `RESIDUAL_GAP` 与 `MANUAL_ONLY_GAP` 两个 coverage state。
- 影响: coverage bucket 将不再对 `totalApplicableRuleCount` 形成互斥划分，后续 rollout/adoption 报表会高估 gap 数量，破坏 `TK-633 / DA-635` 对 coverage contract 的承诺。
- 建议: 让 `RESIDUAL_GAP` 仅保留可 delegated 的剩余缺口，或把 manual-only 单独从 residual bucket 中剔除，并补一个显式 `MANUAL_ONLY` 单测验证 bucket 分区。

### 2.2 [P2] Manual-only gaps still collapse to no-gap command messaging
- 位置: `apps/cli/src/commands/review-command.ts:145`
- 问题描述: command surface 仍把 `uncoveredRuleIds` 当作整个 coverage gap 信号，但该字段现在只表示 delegatable gap，不包含 `MANUAL_ONLY`。当 scope 只有 manual-only gaps 时，`review_findings` check、notes 以及 resolved/no-gap 文案都会错误地表现为“没有 coverage gap”。
- 影响: automation 和 reviewer 可能在 `manualFollowUpRequired=true` 的情况下看到 `PASS` 或 “no gap” 语义，遗漏必须的人工作业补充。
- 建议: 将 command/status/note 的 gap 判断切换到“全部 gap”口径，例如 `coverageSummary.residualGapRuleCount + manualOnlyGapRuleCount` 或显式的 combined gap helper；`uncoveredRuleIds` 继续保留为 delegatable-only。

## 3. Notes
1. 当前 Phase A bundle 里还没有 `MANUAL_ONLY` 规则，所以这是 latent issue，但 `DA-635` 已把该 shape 宣称为 rollout baseline，当前窗口修复更稳妥。
2. fresh reviewer 同时确认 docs/ledger 面未发现额外 actionable issue。

## 4. Verification
1. `pnpm run build`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/cli-hybrid-review-runtime.test.ts apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
6. `node ./scripts/governance/check-worktree-review-target.js`（通过）
7. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）
8. `pnpm run check`（通过）

## 复核结论（2026-04-07）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：当前实现确实会把未来 `MANUAL_ONLY` 规则同时投到 `RESIDUAL_GAP` 和 `MANUAL_ONLY_GAP` 两个 bucket，中断 coverage bucket 的互斥性。
   - 处理：接受该 finding，修正 coverage bucket 划分，并补 `MANUAL_ONLY` runtime 单测。
2. `2.2`
   - 判定：**认可**
   - 证据：`review-command` 的 checks / notes / closeout message 仍只看 delegatable `uncoveredRuleIds`，manual-only gaps 会被误判成 no-gap。
   - 处理：接受该 finding，切换到总 gap 口径，并补 command status/note 单测。

### 验证命令
1. `pnpm run build`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/cli-hybrid-review-runtime.test.ts apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts`（通过）

## 修复执行记录（2026-04-07）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/review/cli-hybrid-review-runtime.ts`、`apps/cli/test/runtime/cli-hybrid-review-runtime.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/cli-hybrid-review-runtime.test.ts apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check`（通过）
   - 说明：manual-only gap 已从 residual bucket 中拆出，coverage buckets 重新恢复互斥分区，并新增专门的 `MANUAL_ONLY` runtime 单测。
2. `2.2`：已完成
   - 变更文件：`apps/cli/src/commands/review-command.ts`、`apps/cli/test/commands/review-command.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/cli-hybrid-review-runtime.test.ts apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check`（通过）
   - 说明：command surface 现在按“总 coverage gap”而非仅 delegatable gap 输出 checks / notes / resolved 文案，并补了 manual-only gap 的 status/note 单测。
