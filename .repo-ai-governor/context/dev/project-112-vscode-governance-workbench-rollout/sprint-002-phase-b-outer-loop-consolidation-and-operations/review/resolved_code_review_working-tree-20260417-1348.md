# Code Review: TK-938 round 10

- Status: resolved
- Date: 2026-04-17
- Reviewer: AI-Agent
- Task: `TK-938`
- CR Task: `CR-010`
- Review Type: delegated fresh recheck
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope

1. `CR-010`
2. `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
3. `packages/config/src/workspace-config-discovery-service.ts`
4. `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
5. `packages/config/test/workspace-config-discovery-service.test.ts`

## 2. Findings

### 2.1 [P1] `CR-010` creation was not synced into the sprint’s canonical task ledgers

- 位置:
  - `CR-010`
  - `tasks/checklist.md`
  - `tasks/tasks.csv`
- 问题描述:
  新一轮 review task 已创建为 `review_pending`，但当时 checklist 与 `tasks.csv` 还没有同步该生命周期记录。
- 影响:
  这会让 active review round 暂时脱离 canonical tracking surface，违反 `CS-021` 与 task-ledger single-write-source contract。
- 建议:
  在启动 round 后立即同步该 `CR-xxx` task，让 sqlite/checklist/CSV 一起进入 `review_pending`。

### 2.2 [P2] Runtime-side workspace context cache could keep stale governance roots after in-session config changes

- 位置:
  - `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
  - `packages/config/src/workspace-config-discovery-service.ts`
- 问题描述:
  round-9 为了避免 repeated discovery 引入了 runtime-level cache，但它只按 opened workspace root 失效，因此在同一 VS Code 会话里编辑 `governor.yaml` 或切换 workspace mode 时，queue/detail/command traffic 可能继续指向旧 workspace root。
- 影响:
  这会在合法 config change 后把 follow-up/HITL/bridge 流量路由到错误的治理目录，属于真实的 session-staleness 风险。
- 建议:
  把缓存收敛到 shared discovery 层，只缓存“已验证的 candidate path”，并在每次 query 时重新解析当前 config；同时补 config change 与 discovery cache regression test。

## 3. Notes

1. round-10 的 P1 台账问题已在同一工作流中修回 canonical surface；P2 则通过调整 cache 边界解决，不再让 runtime 固定住旧 workspace root。

## 4. Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/config/test/workspace-config-discovery-service.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/orchestration-service-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts`（通过）
2. `pnpm run build`（通过）

## 复核结论（2026-04-17）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：`CR-010` 现已同步到 sqlite/checklist/CSV，并重新回到 `review_pending` lifecycle truth。
   - 处理：按 accepted finding 修复。
2. `2.2`
   - 判定：**认可**
   - 证据：runtime 不再缓存完整 workspace context，而是每次重算当前 config；shared discovery 只缓存已验证 candidate path，并新增了“in-session config change”与“cached candidate avoids rewalk”两条回归测试。
   - 处理：按 accepted finding 修复。

### 验证命令

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/config/test/workspace-config-discovery-service.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/orchestration-service-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts`（通过）
2. `pnpm run build`（通过）

## 修复执行记录（2026-04-17）

1. `2.1`：已完成
   - 变更文件：`CR-010`、`tasks/checklist.md`、`tasks/tasks.csv`
   - 验证：`node ./scripts/governance/sync-task-ledger.js --tasks-dir ".../tasks" --task-id CR-010`、后续状态 gates（通过）
   - 说明：新 review round 现已回到 canonical task-ledger write path。
2. `2.2`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`、`packages/config/src/workspace-config-discovery-service.ts`、`apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`、`packages/config/test/workspace-config-discovery-service.test.ts`
   - 验证：full vitest bundle、`pnpm run build`（通过）
   - 说明：cache 被下沉到 shared discovery candidate path 级别，从而避免 repeated rewalk，同时允许同会话 config 变更即时生效。

## 处置结果与剩余风险

1. 本轮 accepted findings 已修复并复核完成；`TK-938` 仍需进入下一轮 fresh clean recheck，只有最新 reviewer round 返回无 actionable finding 时才能进入 sprint closeout。
