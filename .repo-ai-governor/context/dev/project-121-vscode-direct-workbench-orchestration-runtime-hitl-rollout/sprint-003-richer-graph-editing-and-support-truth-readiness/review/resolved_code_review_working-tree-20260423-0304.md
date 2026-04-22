# Code Review: project-121 final delegated review recheck

- Status: resolved
- Date: 2026-04-23
- Reviewer: AI-Agent
- Task: `CR-004`
- Review Type: project-final delegated review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/direct-workbench-orchestration-runtime-hitl-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/governance-workbench-aggregation-facade-contract.md`

## 1. Review Scope

1. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
2. `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
3. `apps/vscode-extension/test/**`
4. `packages/core-orchestration-service/**`
5. `packages/orchestration-service-client/**`
6. `scripts/release/**`
7. `test/release-vscode-extension-distribution-sidecar-readiness.integration.test.ts`
8. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/**`

## 2. Findings

### 2.1 [P2] Workflow Studio presentation growth was still covered by a stale `CS-027` exception

- 位置: `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
- 问题描述: nearby `god-object-exception` 仍然指向 project-112 的 `TK-938/TK-940`，但 project-121 sprint-003 已经继续把 Workflow Studio graph/backlink presentation 责任加到这个 legacy builder 上。当前 sprint WBS 没有新的 extraction task，因此直接 project closeout 会让新的职责增长落在一个 stale exception 上。
- 影响: project-final closeout 会在没有 current project-121 task-linked decomposition plan 的前提下继续保留这段 legacy god-object exception，违反 `CS-027` 的 active-sprint governance 要求。
- 建议: 把 exception ownership 与 focused extraction debt 显式收回到当前 `TK-1042` closeout 台账，并在 project-121 closeout 中保留这项 follow-up 债务。

## 3. Notes

1. reviewer 额外提示 `vscode-extension-command-controller.ts` 仍然保留 legacy exception，但在当前 sprint 计划里已经有 focused extraction handoff note，因此本轮不把它升级为第二个 blocker。
2. `DA-1041` 的 `stay fail-closed` readiness disposition 仍然和当前 runtime/release evidence 一致；本轮没有发现 public/support truth uplift drift。

## 4. Verification

1. `pnpm run build`（通过）
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run release:verify-vscode-extension-distribution`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
7. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 复核结论（2026-04-23）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：presentation builder 的 exception 注释确实仍引用 project-112 任务，而 project-121 的 sprint-003 plan/WBS 里没有 builder extraction task；这会让 project-final closeout 把 stale exception 一并固化。
   - 处理：将 builder/controller 的 `god-object-exception` ownership 改挂 `TK-1042`，并在 `TK-1042`、sprint/project plan 中显式记录 focused extraction debt handoff，保证 project-121 closeout 不把该债务描述为已完成。

### 验证命令

1. `pnpm run build`（通过）
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run release:verify-vscode-extension-distribution`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
7. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 修复执行记录（2026-04-23）

1. `2.1`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`、`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、`.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-003-richer-graph-editing-and-support-truth-readiness/tasks/TK-1042-finalize-project-121-rollout-closeout-and-delivery-evidence-handoff.md`、`.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-003-richer-graph-editing-and-support-truth-readiness/plan.md`、`.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/plan.md`
   - 验证：`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run release:verify-vscode-extension-distribution`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-worktree-review-target.js`（通过）
   - 说明：project-121 现已把 stale exception ownership 收回当前 `TK-1042` closeout 台账，并要求 closeout/audit 显式保留 focused extraction follow-up debt。

## 处置结果与剩余风险

1. `CR-004` 的 accepted finding 已完成修复并重新验证，本轮项目级 review 可以收口为 `resolved`。
2. 仍需再跑一轮 fresh reviewer，确认最新 project-final round 在修复后 clean，之后才执行 `TK-1042` final closeout。
