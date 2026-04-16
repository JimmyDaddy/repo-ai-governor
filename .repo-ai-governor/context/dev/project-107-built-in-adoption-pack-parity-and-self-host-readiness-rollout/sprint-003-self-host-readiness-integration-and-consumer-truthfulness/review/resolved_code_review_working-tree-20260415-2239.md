# Code Review: project-107 final delegated round 4

- Status: resolved
- Date: 2026-04-15
- Reviewer: AI-Agent
- Task: `CR-004`
- Review Type: project-final delegated review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.codex/skills/workspace-code-review-workflow/SKILL.md`

## 1. Review Scope
1. `packages/standards/src/built-in-adoption-pack-catalog.ts`
2. `packages/standards/src/adoption-pack-registry.ts`
3. `packages/standards/src/standards-runtime-loader.ts`
4. `apps/cli/src/runtime/adoption-pack-runtime.ts`
5. `apps/cli/src/commands/doctor-command.ts`
6. `apps/cli/test/adopt-command.integration.test.ts`
7. `README.md`
8. `docs/local-adoption-playbook.md`
9. `docs/support-matrix.md`
10. `.repo-ai-governor/context/dev/project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout`

## 2. Findings
### 2.1 [P1] CR-004 bootstrap state was not yet synchronized into sprint ledgers
- 位置: `tasks/CR-004.md`, `tasks/checklist.md`, `tasks/tasks.csv`
- 问题描述: round 4 task card 已创建，但 initial `review_pending` 状态还未通过 canonical sqlite write-back 渲染到 `checklist.md` / `tasks.csv`，导致 `check-task-ledger-sync` 与 `pnpm run check` 立即报红。
- 影响: project-final review lifecycle 无法被宣称 clean，closeout 在账面上被当前 gate 直接阻断。
- 建议: 先通过 `node ./scripts/governance/sync-task-ledger.js --tasks-dir "<tasks-dir>" --task-id CR-004` 把 `review_pending` row 补齐，再继续后续 verified/resolved lifecycle。

### 2.2 [P2] doctor crashes on malformed adoption receipts instead of surfacing diagnostics
- 位置: `apps/cli/src/commands/doctor-command.ts`, `apps/cli/src/runtime/adoption-pack-runtime.ts`, `apps/cli/test/adopt-command.integration.test.ts`
- 问题描述: round 3 新接入的 doctor-path receipt loading 会把 malformed adoption receipt 直接向上抛出，导致 `doctor --output json` 进入 `UNKNOWN` hard failure，而不是保留诊断面并发出可消费的 receipt-health signal。
- 影响: 当仓库 adoption metadata 损坏时，使用者恰恰会失去最需要的 readiness diagnostics surface。
- 建议: 对 doctor-path receipt loading 做 error-to-diagnostic fallback，把 malformed receipt 转成稳定的 fail check / diagnostics artifact，再用 integration test 锁住 contract。

## 3. Notes
1. 本轮 project-final review 发现 2 条 actionable findings；在二者都完成修复并通过同窗口 full matrix 前，`TK-899` 不得进入 final closeout claim。

## 4. Verification
1. reviewer 使用 code inspection、`node ./scripts/governance/check-task-ledger-sync.js` 和 malformed-receipt `doctor --output json` repro 确认上述问题存在。
2. 主 agent 已完成修复并在同窗口通过以下验证：
   - `node ./scripts/governance/sync-task-ledger.js --tasks-dir ".repo-ai-governor/context/dev/project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout/sprint-003-self-host-readiness-integration-and-consumer-truthfulness/tasks"`
   - `node ./scripts/governance/check-task-ledger-sync.js`
   - `pnpm run build`
   - `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
   - `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
   - `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
   - `node ./scripts/governance/run-normative-loading-manifest-gate.js`
   - `node ./scripts/governance/check-sprint-plan-status-sync.js`
   - `node ./scripts/governance/check-code-review-status-sync.js`
   - `node ./scripts/governance/check-technical-solution-delivery-registry.js`
   - `node ./scripts/governance/check-worktree-review-target.js`
   - `pnpm run check`

## 复核结论（2026-04-15）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`CR-004.md` 已存在但 initial bootstrap 时尚未写回 `tasks.csv` / `checklist.md`；`node ./scripts/governance/check-task-ledger-sync.js` 复核时直接报出 `CR-004: missing row in tasks.csv`。
   - 处理：接受并已通过 canonical `sync-task-ledger.js` 写回补齐 round-4 `review_pending` ledger row。
2. `2.2`
   - 判定：**认可**
   - 证据：主 agent 使用坏 JSON receipt 的最小临时仓库复现后，`doctor --output json` 确实返回 `error_code=UNKNOWN` 并失去 diagnostics payload；当前补丁已将 doctor-path receipt 读取错误收敛为 `adoption-receipt-diagnostics` fail check，并新增 integration regression test。
   - 处理：接受并以 runtime fallback + receipt parse standardization + integration regression coverage 进入修复收口。

## 修复执行记录（2026-04-15）

1. `2.1`：已完成
   - 变更文件：`tasks/CR-004.md`、`tasks/checklist.md`、`tasks/tasks.csv`
   - 验证：`node ./scripts/governance/sync-task-ledger.js --tasks-dir ".repo-ai-governor/context/dev/project-107-built-in-adoption-pack-parity-and-self-host-readiness-rollout/sprint-003-self-host-readiness-integration-and-consumer-truthfulness/tasks"`、`node ./scripts/governance/check-task-ledger-sync.js`（通过）
   - 说明：round-4 bootstrap 生成的 `CR-004` 已通过 canonical sqlite write-back 渲染回 `checklist.md` / `tasks.csv`，不再阻断后续 gate。
2. `2.2`：已完成
   - 变更文件：`apps/cli/src/runtime/adoption-pack-runtime.ts`、`apps/cli/test/adopt-command.integration.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`、`node ./scripts/governance/run-normative-loading-manifest-gate.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-technical-solution-delivery-registry.js`、`node ./scripts/governance/check-worktree-review-target.js`、`pnpm run check`（通过）
   - 说明：doctor-path adoption receipt 读取失败现已转成稳定的 `adoption-receipt-diagnostics` fail check，而不是让整个 `doctor` 命令在 malformed receipt 下崩溃；新增 integration regression test 锁住该诊断行为。

## 处置结果与剩余风险
1. round 4 的两条 accepted project-final findings 已全部修复并复验通过。
2. 当前仍需一个新的 fresh project-final clean recheck round，确认修复后的 branch delta 没有新增 actionable findings 后，`TK-899` 才能进入正式 closeout。
3. 当前只为坏 receipt 锁住了 diagnostics-surface continuity；若未来要对 multi-receipt ambiguity 或更细粒度的 invalid-schema 分类提供更友好的 doctor 指引，可在后续独立窗口继续细化。
