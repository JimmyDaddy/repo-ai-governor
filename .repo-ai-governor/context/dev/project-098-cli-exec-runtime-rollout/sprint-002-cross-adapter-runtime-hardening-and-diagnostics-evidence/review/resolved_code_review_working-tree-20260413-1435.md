# Code Review: sprint-002-cross-adapter-runtime-hardening-and-diagnostics-evidence round 1

- Status: resolved
- Date: 2026-04-13
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: sprint scoped review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`

## 1. Review Scope

1. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
2. `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
3. `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`
4. `packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`
5. `packages/adapter-sdk/src/native-cli-exec-process-runtime.ts`
6. `packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts`

## 2. Findings

### 2.1 [P2] Shared runtime process-tree policy branches lacked direct regression coverage

- 位置:
  - `packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts`
- 问题描述: sprint-002 把 `Claude Code` / `GitHub Copilot` 都切到 shared native runtime，并宣称补齐 Unix process-group 与 Windows `taskkill /T` 风格的 process-tree termination hardening；但原有 runtime suite 只覆盖 happy path、非零退出与 timeout escalation，没有直接守护 `process_group_best_effort` 分支选择。
- 影响: runtime cleanup 语义属于 lifecycle-sensitive boundary。缺少 branch-level regression guard 时，后续对 tree termination 路径的回归可能在 adapter smoke 和 package suite 仍为绿色的情况下漏出。
- 建议: 为 shared runtime 增加 direct regression case，至少断言 Unix `process.kill(-pid, signal)` 与 Windows hard-kill `taskkill` fallback branch 会在 `process_group_best_effort` policy 下被选中。

## 3. Notes

1. reviewer 未在 `Claude Code` / `GitHub Copilot` cutover、health diagnostics additive truth、hard terminate liveness event surface 上发现除以上 coverage gap 之外的新增 actionable finding。
2. 本轮修复保持在 sprint-002 ownership boundary 内完成，没有把 ACP 升格为 public transport、support wording 或 canonical truth。

## 4. Verification

1. `pnpm run build`（通过，reviewer round 后）
2. `pnpm exec vitest run packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts packages/adapter-sdk/test/agent-cli-exec-operations-runtime.unit.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`（通过，reviewer round 后）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过，reviewer round 后）
4. `pnpm run check`（通过，reviewer round 后）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过，reviewer round 后）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过，reviewer round 后）
7. `node ./scripts/governance/check-code-review-status-sync.js`（通过，reviewer round 后）
8. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过，reviewer round 后）

## 复核结论（2026-04-13）

- 整体结论：**认可**

### 逐条复核

1. `2.1 [P2] Shared runtime process-tree policy branches lacked direct regression coverage`
   - 判定：**认可**
   - 证据：`native-cli-exec-process-runtime.unit.test.ts` 已补充 Unix process-group 与 Windows hard-kill fallback 两条 direct branch regression case，直接守护 `process_group_best_effort` cleanup 路径选择。
   - 处理：保留为 accepted finding，已完成修复并进入验证。

### 验证命令

1. `pnpm run build`（通过）
2. `pnpm exec vitest run packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts packages/adapter-sdk/test/agent-cli-exec-operations-runtime.unit.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run check`（通过）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
7. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
8. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）

## 修复执行记录（2026-04-13）

1. `2.1 [P2] Shared runtime process-tree policy branches lacked direct regression coverage`：已完成
   - 变更文件：
     - `packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts packages/adapter-sdk/test/agent-cli-exec-operations-runtime.unit.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）
   - 说明：shared runtime 现在对 `process_group_best_effort` 的 Unix / Windows branch selection 具备直接回归守护，更贴合 sprint-002 的 cross-platform terminate hardening claim。
