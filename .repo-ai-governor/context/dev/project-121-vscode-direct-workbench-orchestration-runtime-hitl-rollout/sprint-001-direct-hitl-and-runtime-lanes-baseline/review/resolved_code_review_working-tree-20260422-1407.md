# Code Review: working-tree-20260422-1407

- Status: resolved
- Date: 2026-04-22
- Reviewer: AI-Agent
- Task: `CR-010`
- Review Type: sprint delegated recheck
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`

## 1. Review Scope
1. `packages/core-orchestration-service/src/local-orchestration-service-review-routing-runtime.ts`
2. `packages/core-orchestration-service/test/local-orchestration-service-review-routing-runtime.test.ts`
3. `packages/core-orchestration-service/test/local-orchestration-service-governance-query-runtime.test.ts`
4. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
5. `packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts`
6. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks/CR-010.md`

## 2. Findings
### 2.1 [P1] Live sprint CR artifacts never matched execution-scoped review routing
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-review-routing-runtime.ts:190`
- 问题描述: 第十轮 reviewer 发现 review routing 仍然偏向 execution taskId 精确匹配，而当前 sprint 的真实 review 产物是 `resolved_code_review_working-tree-*.md` + `Task: CR-00x`。这会让 `resolveExecutionReviewDocumentPath()` 在 live sprint surface 上找不到 review 文档，从而让 structured review handoff、artifact-pane scoping，以及 `roleLaneStatus / hitlDecisionPacket` 的 review backlink 再次失效。
- 影响: VS Code direct workbench 在真实 sprint-001 review surface 上仍可能丢失 `review_document` handoff 和 review backlink，违背了 direct-workbench review-backlink contract。
- 建议: review matcher 需要同时利用 review 文件路径中的 `project/sprint` 事实，并把当前 sprint 的 `working-tree / CR-*` 生命周期评审产物作为合法 fallback；但对普通无 task ownership 的 scope review 仍要保持 fail-closed，避免误把任意同 sprint 文档当作 execution review。

## 3. Notes
1. 本轮 reviewer 只发现 1 条 actionable finding，属于 live sprint review lifecycle 与 execution-scoped review routing 的兼容缺口。
2. 修复保留了 review routing 的 fail-closed 特性：只有当前 sprint 的 `working-tree / CR-*` 生命周期评审产物才会走最新 fallback，普通 scope tie 仍返回 `undefined`。

## 4. Verification
1. `pnpm run typecheck`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-review-routing-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-governance-query-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts`（通过）
3. `pnpm run build`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
5. `pnpm run check:ide-entry-smoke`（通过）
6. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks`（通过）
7. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
8. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
9. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
10. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 复核结论（2026-04-22）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：reviewer 指出的 live sprint mismatch 成立。当前 sprint 的 resolved review 文件确实是 `working-tree` + `CR-*` 形态，原来的 matcher 无法把这些文档当作 execution review fallback，因此 structured handoff 在真实工区上会再次失联。
   - 处理：review routing 现在会把 review 文件路径纳入 scoring，并仅对当前 sprint 的 `working-tree / CR-*` 生命周期评审产物启用最新 fallback；对普通 `scope-a/scope-b` 这类非 task-owned tie 继续 fail-closed。同时增加 review-routing runtime、governance query runtime、shell 与 sidecar 四层回归测试。

### 验证命令
1. `pnpm run typecheck`（通过）
2. `pnpm run build`（通过）

## 修复执行记录（2026-04-22）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-review-routing-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-review-routing-runtime.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-governance-query-runtime.test.ts`
   - 验证：`pnpm run typecheck`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-review-routing-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-governance-query-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke`、`node ./scripts/governance/check-task-required-inputs.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-worktree-review-target.js`（通过）
   - 说明：execution review routing 现在既能在 live sprint review dir 里拾取最新 working-tree `CR-*` lifecycle artifact，又不会把普通 scope tie 错绑到 execution 上。

## 处置结果与剩余风险

1. 本轮 accepted finding 已全部修复并复验。
2. sprint-001 仍需继续执行 fresh delegated reviewer round；只有最新 round 无 actionable findings 时，closeout 才可进入。
