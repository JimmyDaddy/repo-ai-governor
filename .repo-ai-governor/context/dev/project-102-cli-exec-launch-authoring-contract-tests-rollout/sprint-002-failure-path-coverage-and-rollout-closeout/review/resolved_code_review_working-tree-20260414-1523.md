# Code Review: project-102 final working tree

- Status: resolved
- Date: 2026-04-14
- Reviewer: AI-Agent
- Task: `CR-002`
- Review Type: working tree review
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
1. `packages/adapters/codex/src/codex-agent-adapter.ts`
2. `packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`
3. `.repo-ai-governor/context/dev/project-102-cli-exec-launch-authoring-contract-tests-rollout/sprint-002-failure-path-coverage-and-rollout-closeout/tasks/CR-002.md`
4. `.repo-ai-governor/context/dev/project-102-cli-exec-launch-authoring-contract-tests-rollout/sprint-002-failure-path-coverage-and-rollout-closeout/tasks/checklist.md`
5. `.repo-ai-governor/context/dev/project-102-cli-exec-launch-authoring-contract-tests-rollout/sprint-002-failure-path-coverage-and-rollout-closeout/tasks/tasks.csv`

## 2. Findings
### 2.1 [P1] Codex CLI exec results with non-zero exit or signal are accepted as success
- 位置: `packages/adapters/codex/src/codex-agent-adapter.ts:820`
- 问题描述: `parseCodexCliOutput()` 只校验 JSON 事件形状，不会在解析前拒绝 `executionResult.exitCode !== 0` 或 `executionResult.signal !== null` 的结果，因此失败或被信号终止的 Codex 进程只要还 flush 出合法 completed payload，就会被当成成功 invoke/probe。
- 影响: 会把真实 subprocess failure 误报为成功，破坏当前 rollout 需要保证的 failure-path truth 与 preserved facts。
- 建议: 在 JSON 解析前先 fail-fast 拒绝 non-zero / signal result，并补充对应 smoke coverage，确认 launch diagnostics 仍按 additive truth 投影。

### 2.2 [P2] CR-002 尚未同步到 active sprint ledger
- 位置: `.repo-ai-governor/context/dev/project-102-cli-exec-launch-authoring-contract-tests-rollout/sprint-002-failure-path-coverage-and-rollout-closeout/tasks/CR-002.md:1`
- 问题描述: `CR-002` task card 已创建并进入 `review_pending`，但当前 sprint 的 `checklist.md`、`tasks.csv` 与 sqlite canonical ledger 尚未回写该 review task。
- 影响: 当前 closeout readiness 会基于不完整 review surface 判断，且 `check-task-ledger-sync.js` 已因此失败。
- 建议: 立刻按 canonical ledger 流程同步 `CR-002`，再在后续状态迁移时持续保持 `CR-002` 与 review artifact 同步推进。

## 3. Notes
1. 本轮 fresh reviewer 子 agent 为 `019d8ae1-2721-77e1-a1fe-7432cfaa102c`（`Nietzsche`）。
2. reviewer 另提到 GitHub Copilot failure-path launch truth 断言仍有加固空间，但当前未判定为 blocking finding。

## 4. Verification
1. `node ./scripts/governance/check-task-ledger-sync.js`（失败：`[stream-project-102-sprint-002] CR-002: missing row in tasks.csv`）
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
3. `node ./scripts/governance/check-code-review-status-sync.js`（通过）

## 复核结论（2026-04-14）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] Codex CLI exec results with non-zero exit or signal are accepted as success`
   - 判定：**认可**
   - 证据：`parseCodexCliOutput()` 现已在 JSON 解析前拒绝 `signal !== null` 与 `exitCode !== 0`，并补充了 non-zero / signal 两条 Codex smoke 回归。
   - 处理：已修复，等待完整 project-final verification bundle 复跑后进入 `resolved`。
2. `2.2 [P2] CR-002 尚未同步到 active sprint ledger`
   - 判定：**认可**
   - 证据：`sync-task-ledger.js --task-id CR-002` 已回写 checklist / tasks.csv / sqlite，随后 `check-task-ledger-sync.js` 已恢复通过。
   - 处理：已修复，等待 CR lifecycle 与 closeout 验证同步收口。

### 验证命令
1. `pnpm exec vitest run packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-14）

1. `2.1 [P1] Codex CLI exec results with non-zero exit or signal are accepted as success`：已完成
   - 变更文件：`packages/adapters/codex/src/codex-agent-adapter.ts`、`packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`
   - 验证：`pnpm exec vitest run packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check`（通过）
   - 说明：在 Codex CLI parser 前增加 non-zero / signal fail-fast，并补齐 invoke failure-path smoke coverage。
2. `2.2 [P2] CR-002 尚未同步到 active sprint ledger`：已完成
   - 变更文件：`tasks/CR-002.md`、`tasks/checklist.md`、`tasks/tasks.csv`
   - 验证：`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`（通过）
   - 说明：已通过 canonical ledger flow 将 `CR-002` 的 `review_pending -> verified -> resolved` 生命周期同步到 sqlite / checklist / tasks.csv。
3. `fresh reviewer recheck / [P2] Probe exit/signal regression still lacks direct coverage`：已完成
   - 变更文件：`packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`
   - 验证：`pnpm exec vitest run packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check`（通过）
   - 说明：补充 probe non-zero / signal 两条 smoke regression，直接覆盖 availability 与 launch-diagnostics mapping。

## 处置结果与剩余风险（2026-04-14）

1. fresh reviewer clean recheck（sub-agent `019d8b18-1cc0-7f62-9e48-7398484ed215` / `James`）未发现新的 actionable finding，`CR-002` 当前边界可收口为 `resolved`。
2. 本次 project-final review 未发现新的阻塞风险；剩余 follow-up 仅为顺序执行 `project-103 ~ project-105`，不属于 `project-102` 未完成项。
2. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
4. `node ./scripts/governance/check-code-review-status-sync.js`（通过）

## 复核结论（2026-04-14，fresh reviewer recheck）

- 整体结论：**部分认可**

### 逐条复核
1. `fresh reviewer recheck / [P2] Probe exit/signal regression still lacks direct coverage`
   - 判定：**认可**
   - 证据：`parseCodexCliOutput()` 同时被 `probe()` 与 `invokeStage()` 复用，但现有新增回归只覆盖了 invoke path，确实会让 probe-side availability / launch-diagnostics mapping 缺少直接保护。
   - 处理：已接受并补充 probe non-zero / signal 两条 smoke 回归，当前等待同窗 `build / test:packages / check` 重跑后进入最终 `resolved`。

### 验证命令
1. `pnpm exec vitest run packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
