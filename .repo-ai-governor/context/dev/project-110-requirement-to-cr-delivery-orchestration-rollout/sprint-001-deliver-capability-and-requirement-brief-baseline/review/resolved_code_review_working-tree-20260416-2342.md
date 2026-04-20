# Code Review: sprint-001 deliver capability and requirement brief baseline round 11

- Status: resolved
- Date: 2026-04-16
- Reviewer: AI-Agent
- Task: `CR-011`
- Review Type: delegated sprint clean recheck
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/session-main-capability-interaction-model-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/session-shell-delivery-workflow-presenter-contract.md`

## 1. Review Scope
1. `apps/cli/test/cli-skeleton.integration.test.ts`
2. `apps/cli/test/cli-output-contract.integration.test.ts`
3. `apps/cli/src/main.ts`
4. `.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks`
5. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 2. Findings
### 2.1 [P2] CLI help contract does not lock deliver's alias-only discoverability
- 位置: `apps/cli/test/cli-skeleton.integration.test.ts:48`
- 问题描述: top-level `--help` integration coverage 只验证了 governed capability catalog 的存在与 `/review verify` 条目，没有显式钉住 `Deliver` 行必须保持 `[chat-first]`，也没有验证 `/deliver` 不能被重新暴露成 public help appendix entry。
- 影响: 即使当前 live help 行为正确，未来 presenter refactor 仍可能悄悄把 `/deliver` 重新提升成 public canonical surface，而现有测试不会失败。
- 建议: 为 top-level help 增加 `Deliver` chat-first 行与 `/deliver` 缺席断言，并补一个 companion output-contract case 锁住中文 help 的 alias-only wording。

## 3. Notes
1. slash palette 对 `/deliver` 的排除已由 `apps/cli/test/runtime/session-slash-command-registry.test.ts` 覆盖；本轮剩余缺口只在 public CLI help / appendix contract。
2. reviewer 未再发现 `deliveryWorkflowState`、`TURN_COMPLETED` presenter metadata、task ledger、CR lifecycle evidence 或 delivery registry 的新增漂移。

## 4. Verification
1. `pnpm run build`（通过，来自 round-11 修复前基线）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过，来自 round-11 修复前基线）
3. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir ./.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks --task-id TK-925`（通过，来自 round-11 修复前基线）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过，来自 round-11 修复前基线）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过，来自 round-11 修复前基线）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过，来自 round-11 修复前基线）
7. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过，来自 round-11 修复前基线）
8. `node ./scripts/governance/check-worktree-review-target.js`（通过，来自 round-11 修复前基线）

## 复核结论（2026-04-16）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：当前 live `--help` 已正确展示 chat-first `Deliver` 行且未公开 `/deliver`，但 integration/output-contract tests 还没把这条 alias-only public help contract 锁住。
   - 处理：已在 `cli-skeleton` 增加英文顶层 help 对 `[chat-first] Deliver` 与 `/deliver` 缺席的断言，并在 `cli-output-contract` 增加 `zh-CN --help` 的 companion alias-only wording coverage。

### 验证命令
1. `pnpm run build`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）
3. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir ./.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks --task-id TK-925`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
7. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）
8. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 风险与后续
1. round-11 finding 已完成复核与修复；下一步可进入新的 fresh reviewer clean round。

## 修复执行记录（2026-04-16）

1. `2.1`：已完成
   - 变更文件：`apps/cli/test/cli-skeleton.integration.test.ts`、`apps/cli/test/cli-output-contract.integration.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`、`node ./scripts/governance/check-task-required-inputs.js --tasks-dir ./.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks --task-id TK-925`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-technical-solution-delivery-registry.js`、`node ./scripts/governance/check-worktree-review-target.js`（通过）
   - 说明：top-level help 现已在英文 skeleton test 与中文 output-contract test 中锁住 `Deliver` 的 chat-first 行和 `/deliver` 缺席约束，避免 future presenter refactor 把 alias 提升成 public canonical surface。

## 处置结果与剩余风险
1. round-11 的 accepted finding 已全部修复并完成验证。
2. sprint-001 仍需新的 fresh reviewer clean round 返回“无 actionable finding”后，才可推进 closeout。
