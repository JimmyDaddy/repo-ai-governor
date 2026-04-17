# Code Review: sprint-001 primary workbench baseline round 1

- Status: resolved
- Date: 2026-04-17
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: sprint boundary review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/governance-workbench-aggregation-facade-contract.md`

## 1. Review Scope

1. `apps/vscode-extension/package.json`
2. `apps/vscode-extension/package.nls.json`
3. `apps/vscode-extension/package.nls.zh-cn.json`
4. `apps/vscode-extension/src/**`
5. `apps/vscode-extension/test/**`
6. `.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-001-phase-a-primary-workbench-baseline/tasks/TK-936-freeze-vscode-primary-workbench-baseline-and-service-owned-task-review-seams.md`

## 2. Findings

### 2.1 [P2] Frozen capability metadata drifts from active workbench contracts

- 位置: `apps/vscode-extension/src/constants/vscode-extension.constant.ts:73`
- 问题描述: `queryCapabilityClasses` 尚未覆盖正式 contract 要求的稳定 capability taxonomy；`commandCapabilityClasses` 则把 extension-local affordance 名称混入了 aggregation facade 的 capability 字段，导致 frozen snapshot 会输出一份“当前 UI 能跑、但 contract metadata 不合约”的表述。
- 影响: 后续 discoverability、DTO consumer 或 contract gate 读取 Phase A snapshot 时，会把不完整或错误命名的 capability metadata 当成 promotion-safe 基线。
- 建议: 把 query capability taxonomy 对齐到 VS Code workbench surface contract 的最小集合；把 command capability metadata 收窄到 aggregation facade vocabulary 内真正已暴露的服务级 mutation class，并补对应 contract test。

### 2.2 [P2] Review-queue fallback and selection-clearing branches lack focused regression coverage

- 位置: `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts:73`
- 问题描述: 新增 review queue 后，控制流引入了 `handleReviewQueueSelection`、`mergeCommandRequest` 的显式清空语义，以及 `openHandoffTarget` 从 execution handoff 回退到 `reviewSourcePath` 的分支，但当前测试没有直接覆盖这些行为。
- 影响: 一旦回归，review queue item 可能继续打开上一个 execution 的详情或交接目标，属于用户可见且较难通过肉眼 diff 发现的行为错误。
- 建议: 至少补 3 组定向回归测试，覆盖 review queue selection、显式 `undefined` 清空旧 selection、以及 review-source-only handoff fallback。

## 3. Notes

1. `context/memory/*` 的未跟踪 sqlite 噪音未纳入本轮 actionable finding；当前 review 仍限定在 sprint-001 的 code/task boundary。

## 4. Verification

1. `pnpm run build`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`（通过）
3. `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-001-phase-a-primary-workbench-baseline/tasks" --task-id TK-936`（通过）
4. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-001-phase-a-primary-workbench-baseline/tasks" --task-id TK-936`（通过）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）

## 复核结论（2026-04-17）

- 整体结论：**认可**

### 逐条复核

1. `2.1 [P2] Frozen capability metadata drifts from active workbench contracts`
   - 判定：**认可**
   - 证据：`apps/vscode-extension/src/constants/vscode-extension.constant.ts` 中的 frozen capability arrays 确实未覆盖 formal contract 要求的最小 query taxonomy，且 command capability metadata 混入了 extension-local affordance 名称。
   - 处理：已接受，主 agent 将 capability taxonomy 对齐到 formal contract，并把 extension-local command id 与 facade capability metadata 显式分层。
2. `2.2 [P2] Review-queue fallback and selection-clearing branches lack focused regression coverage`
   - 判定：**认可**
   - 证据：当前 test suite 未直接覆盖 review queue selection、显式 `undefined` 清空旧 selection、以及 review-source-only handoff fallback 这 3 条新控制流。
   - 处理：已接受，主 agent 将补齐 controller/provider 定向回归，并顺手覆盖 service runtime 的 queue overview happy-path seam。

### 验证命令

1. `pnpm run build`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`（通过）

## 修复执行记录（2026-04-17）

1. `2.1 [P2] Frozen capability metadata drifts from active workbench contracts`：已完成
   - 变更文件：`apps/vscode-extension/src/constants/vscode-extension.constant.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`（通过）
   - 说明：已把 Phase A frozen capability arrays 对齐到 formal workbench/facade contract vocabulary，query taxonomy 现在覆盖 required stable classes，command capability metadata 仅保留 façade vocabulary 内的 service-level mutation classes。
2. `2.2 [P2] Review-queue fallback and selection-clearing branches lack focused regression coverage`：已完成
   - 变更文件：`apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`、`apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`（通过）
   - 说明：已补 `handleReviewQueueSelection`、review-source-only `openHandoffTarget` fallback、显式 `undefined` 清空旧 selection 的回归测试，并补了一条 `resolveWorkbenchOverviewSnapshot` 的 runtime happy-path seam 覆盖。
