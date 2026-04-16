# Code Review: sprint-001 deliver capability and requirement brief baseline round 13

- Status: resolved
- Date: 2026-04-17
- Reviewer: AI-Agent
- Task: `CR-013`
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
### 2.1 [P1] Preview-style delivery workflow asks still launch the deliver execution path
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts:75`
- 问题描述: `deliver` 的 start-style matcher 会先匹配 `delivery workflow`，而 preview-style wording 没有在 execution matcher 里被排除，所以 `Start the delivery workflow preview.` 会被错误识别成 `deliver.requirement_to_cr`，随后 dispatcher 创建新的 `deliveryWorkflowState`，把 read-only preview ask 变成一次有副作用的 workflow start。
- 影响: 预览路径会错误污染 shared-session delivery truth，违背 capability interaction contract 与 shell presenter contract 里“`workflow.preview` 只做 preview、`deliver` 只在明确 execution ask 时启动”的边界。
- 建议: 为 execution intent 引入统一 preview/create/edit/template 排除条件，让 preview-style asks 优先落回 `/workflow`，并补 registry/dispatcher 回归测试，确保 preview 不再生成 `deliveryWorkflowState`。

### 2.2 [P2] Generic English delivery prose is still hijacked by the Deliver capability explainer
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts:74`
- 问题描述: explainer 对英文 `deliver` 的 direct reference 仍然过宽，`Tell me about how we deliver the release notes.` 这种普通 delivery 讨论会被误识别成 Deliver capability detail request，dispatcher 因为先 consult capability explainer，最终直接返回 Deliver capability 说明，而不是回到正常 answer path。
- 影响: 普通语义层的 delivery 讨论会被 capability discoverability 文案抢答，用户得到错误上下文，后续也更容易把 capability explainer 误当成 generic help fallback。
- 建议: 把英文 deliver direct-reference 收窄到显式 capability-style phrasing（例如裸 `deliver`、`/deliver`、`deliver workflow`、`deliver capability` 等），同时补 explainer/dispatcher 负向回归，确保 generic prose 不再被 capability answer 抢答。

## 3. Notes
1. round-13 两个 finding 都是 fresh reviewer 在 clean recheck 中发现的新误捕获路径，均未改变 `deliver` chat-first / alias-only 总体契约，只是补齐 preview 和 generic English prose 这两个漏网分支。
2. 本轮未再发现 task ledger、review lifecycle、delivery registry、CLI alias-only help contract 或 child capability wiring 的新增漂移。

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
   - 证据：preview-style asks 不应创建 `deliveryWorkflowState`；当前 registry 先命中 `deliver` start matcher，再错过 `/workflow` preview route，确实把只读 preview 请求升级成了 execution mutation。
   - 处理：已把 preview/create/edit/template 这类非执行型 workflow wording 提升为通用 execution exclusion，`deliver` 与 `run` 都会先排除这些语义，再由 `/workflow` preview route 接管。
2. `2.2`
   - 判定：**认可**
   - 证据：英文 explainer 之前只要出现 `deliver` 单词就会把 detail prose 解释成 Deliver capability 请求，而 dispatcher 会优先消费 capability answer，generic delivery discussion 因而无法回到正常 answer path。
   - 处理：已把英文 `deliver` direct-reference 收窄到显式 capability-style phrasing，并补 explainer/dispatcher 负向回归，避免 generic delivery prose 被 capability discoverability 抢答。

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
1. round-13 findings 已完成复核与修复；仍需新的 fresh reviewer clean round 返回“无 actionable finding”后，sprint-001 才能进入 closeout。

## 修复执行记录（2026-04-17）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`、`pnpm run build`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）
   - 说明：preview-style delivery workflow asks 已回到 `/workflow` preview route，不再错误创建 execution-state。
2. `2.2`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`、`pnpm run build`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）
   - 说明：generic English delivery prose 已不再触发 Deliver capability explainer；只有显式 capability-style phrasing 才会进入 deliver detail answer。

## 处置结果与剩余风险
1. round-13 的 accepted findings 已全部修复并完成代码面验证。
2. 同窗口 task-ledger、review-status、delivery-registry 与 worktree-review-target 治理检查已全部通过，当前 round-13 已形成 fully synced `resolved` 证据面。
