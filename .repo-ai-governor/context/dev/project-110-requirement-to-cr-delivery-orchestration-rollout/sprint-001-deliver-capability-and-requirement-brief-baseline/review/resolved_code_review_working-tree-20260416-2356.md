# Code Review: sprint-001 deliver capability and requirement brief baseline round 12

- Status: resolved
- Date: 2026-04-16
- Reviewer: AI-Agent
- Task: `CR-012`
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
1. `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
2. `packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`
3. `packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
4. `.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks`

## 2. Findings
### 2.1 [P1] Deliver start matcher steals reusable `/run` workflow asks
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts:75`
- 问题描述: deliver 的英文 start-style matcher 把通用 `governed workflow` 也当成 governed delivery workflow 入口，导致 `run the next governed workflow for this repo` 这类明确应该走 `/run` 的 reusable execution ask 被错误路由到 `deliver.requirement_to_cr`。这同时违背了 capability interaction contract 里“`deliver` 是 parent AI workflow、`run` 仍保留 reusable governed workflow public surface”的边界。
- 影响: reusable governed execution flow 的对话入口会被 `deliver` parent capability 吞掉，用户会在 task-driven execution boundary 上得到错误 workflow，后续 `deliver`/`run` discoverability 和 presenter truth 也更容易再次漂移。
- 建议: 把 deliver 的英文 start matcher 收窄回显式 `delivery workflow`、`deliver workflow` 或 `governed path` 语义，并补充负向/正向回归测试，确保 generic start-style delivery asks 继续 fall through，而 reusable governed workflow asks 稳定保留在 `/run`。

## 3. Notes
1. round-12 reviewer 列举的 generic start-style delivery asks（`开始交付 release notes。`、`发起交付演练。`、`Start the requirement-to-cr docs update.`）现已由 registry 和 dispatcher 双侧负向回归覆盖。
2. 本轮未再发现 `deliver` parent capability、child capability catalog、shared-session delivery presenter metadata 或 CLI alias-only contract 的新增漂移。

## 4. Verification
1. `pnpm run build`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）
3. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir ./.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks --task-id TK-925`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
7. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）
8. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 复核结论（2026-04-16）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`session-main-capability-interaction-model-contract` 明确要求 `deliver` 作为 parent AI workflow 只消费 requirement-to-CR governed delivery intent，而 `run` 的 public wording 仍保留 reusable governed workflow / task-driven execution flow；当前 matcher 把 generic `governed workflow` 直接并入 deliver start rule，确实会把 `/run` ask 误路由。
   - 处理：已移除 deliver start matcher 里的 generic `governed workflow` 分支，只保留 delivery-specific wording；同时保留并扩展 registry/dispatcher 的负向回归用例，确保 generic start-style delivery asks 不再误入 `deliver`，而 explicit reusable governed workflow ask 继续稳定走 `/run`。

### 验证命令
1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`（通过）
3. `pnpm run build`（通过）
4. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）
5. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir ./.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks --task-id TK-925`（通过）
6. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
7. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
8. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
9. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）
10. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 风险与后续
1. round-12 finding 已完成复核与修复；仍需新的 fresh reviewer clean round 返回“无 actionable finding”后，sprint-001 才能进入 closeout。

## 修复执行记录（2026-04-16）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`、`pnpm run build`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`、`node ./scripts/governance/check-task-required-inputs.js --tasks-dir ./.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks --task-id TK-925`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-technical-solution-delivery-registry.js`、`node ./scripts/governance/check-worktree-review-target.js`（通过）
   - 说明：deliver matcher 已重新聚焦到 delivery-specific wording，不再吞掉 reusable `/run` governed workflow ask；generic start-style delivery fallthrough 与 `/run` intent 保留均已被回归测试锁住。

## 处置结果与剩余风险
1. round-12 的 accepted finding 已全部修复并完成代码面验证。
2. 同窗口 task-ledger、review-status、delivery-registry 与 worktree-review-target 治理检查已全部通过，当前 round-12 已形成 fully synced `resolved` 证据面。
