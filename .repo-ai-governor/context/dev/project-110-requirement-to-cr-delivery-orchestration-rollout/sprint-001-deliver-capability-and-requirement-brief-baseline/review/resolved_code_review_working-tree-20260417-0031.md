# Code Review: sprint-001 deliver capability and requirement brief baseline round 14

- Status: resolved
- Date: 2026-04-17
- Reviewer: AI-Agent
- Task: `CR-014`
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
2. `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts`
3. `packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`
4. `packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts`
5. `packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
6. `.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks`

## 2. Findings
### 2.1 [P1] Generic English `delivery workflow` start/run asks still start the Deliver parent workflow
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts:86`
- 问题描述: deliver matcher 仍把 generic English `start/run ... delivery workflow` phrasing 当成 requirement-to-CR governed delivery execution ask，因此 `Start the delivery workflow for the release notes.` 和 `Run the delivery workflow for our docs handoff.` 会直接被路由成 `deliver.requirement_to_cr`，随后 dispatcher 创建新的 `deliveryWorkflowState`。这类提示并没有 requirement-to-CR 或 governed-path signal，本质上仍是普通 artifact/docs-process 描述。
- 影响: ordinary delivery phrasing 仍会意外污染 shared-session deliver truth，违背 “deliver 只在明确 requirement-to-CR governed execution ask 下启动” 的运行时边界。
- 建议: 把 English deliver matcher 继续收窄到 requirement-to-CR / governed-path / governed delivery workflow 语义；generic `delivery workflow` phrasing 只允许走普通 answer path，不能再触发 execution mutation。

### 2.2 [P2] Generic `delivery workflow` discussion is still hijacked by capability/discoverability surfaces
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts:82`
- 问题描述: 在 round-13 之后，generic `delivery workflow` detail/examples 不再进入 Deliver explainer，但仍会被 generic `workflow` direct-reference 或 workflow deterministic route 接管。这样 `Tell me about the delivery workflow for the release notes.` / `Show me examples for the delivery workflow for release notes.` 仍然不会回到正常 answer path。
- 影响: 普通业务讨论继续被 capability/discoverability surface 抢答，只是从 Deliver capability 漂移成了 Workflow capability；用户仍然拿不到与当前业务上下文一致的普通回答。
- 建议: Workflow 的 deterministic route 只保留 preview/template 语义；workflow explainer 也只接受显式 `/workflow` 或 capability-style wording，避免 generic `delivery workflow` 讨论被任何 deterministic surface 抢走。

## 3. Notes
1. round-14 继续是 clean recheck 里暴露的 English wording 漏口，本轮补的不是新 capability，而是把 `deliver`、`workflow`、capability explainer 三个入口的权限边界统一到同一套显式语义上。
2. 本轮未再发现 review lifecycle、task ledger、delivery registry、shared-session presenter metadata 或 CLI alias-only help contract 的新增漂移。

## 4. Verification
1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts`（通过）
3. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`（通过）
4. `pnpm run build`（通过）
5. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）
6. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir ./.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks --task-id TK-925`（通过）
7. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
8. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
9. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
10. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）
11. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 复核结论（2026-04-17）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：generic `delivery workflow` phrasing 没有 requirement-to-CR 或 governed-path signal，却仍被 deliver matcher 提升成 execution start；这会直接创建 `deliveryWorkflowState`，属于明确的 session-state mutation 越权。
   - 处理：已把 English deliver matcher 进一步收窄到 requirement-to-CR / governed-path / governed delivery workflow 语义，并同步收窄 generic workflow execution route，避免 `delivery workflow` 这种泛化 phrasing 再走 deterministic execution path。
2. `2.2`
   - 判定：**认可**
   - 证据：即使 Deliver explainer 已收窄，generic `delivery workflow` 讨论仍会被 `workflow` deterministic route 或 workflow explainer 接住，说明 discoverability surface 仍然过宽。
   - 处理：已把 workflow deterministic route 改成 preview/template only，并把 workflow explainer direct-reference 收窄到显式 `/workflow` / capability-style wording；generic `delivery workflow` detail/examples 现会回到普通 answer path。

### 验证命令
1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts`（通过）
3. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`（通过）
4. `pnpm run build`（通过）
5. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）
6. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir ./.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks --task-id TK-925`（通过）
7. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
8. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
9. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
10. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）
11. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 风险与后续
1. round-14 findings 已完成复核与修复；仍需新的 fresh reviewer clean round 返回“无 actionable finding”后，sprint-001 才能进入 closeout。

## 修复执行记录（2026-04-17）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`、`pnpm run build`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）
   - 说明：generic `start/run ... delivery workflow` phrasing 现已不再启动 Deliver parent workflow，也不会再生成新的 `deliveryWorkflowState`。
2. `2.2`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`、`pnpm run build`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）
   - 说明：generic `delivery workflow` detail/examples 现已不再被 Deliver 或 Workflow capability/discoverability surface 抢答，而是稳定回到普通 answer path。

## 处置结果与剩余风险
1. round-14 的 accepted findings 已全部修复并完成代码面验证。
2. 同窗口 task-ledger、review-status、delivery-registry 与 worktree-review-target 治理检查已全部通过，当前 round-14 已形成 fully synced `resolved` 证据面。
