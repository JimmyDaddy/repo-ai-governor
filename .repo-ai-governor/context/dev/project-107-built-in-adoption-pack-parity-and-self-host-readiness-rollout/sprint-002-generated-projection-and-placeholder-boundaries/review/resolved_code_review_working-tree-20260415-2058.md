# Code Review: sprint-002-generated-projection-and-placeholder-boundaries round 1

- Status: resolved
- Date: 2026-04-15
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: sprint boundary review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`

## 1. Review Scope
1. `packages/standards/src`
2. `packages/standards/test`
3. `apps/cli/src/runtime/adoption-pack-runtime.ts`
4. `apps/cli/test/adopt-command.integration.test.ts`
5. `project-107 / sprint-002` task-ledger surfaces

## 2. Findings
### 2.1 [P2] `adopt verify` still reports false-green for fresh self-host placeholder governance surfaces
- 位置: `apps/cli/src/runtime/adoption-pack-runtime.ts:380`
- 问题描述: `verify()` 仍只检查 receipt、host apply report 与 managed drift，没有消费本轮 built-in source catalog / readiness matrix 中标记给 `adopt_verify` 的 placeholder readiness metadata。fresh self-host `adopt apply` 后，`code_standards.md` 与 `long-term-maintenance-guide.md` 仍是 draft starter content，但 `adopt verify` 结果保持 `warn=0`。
- 影响: 用户会把 self-host placeholder surface 误判成已 ready，削弱本轮 placeholder boundary 的实际可见性。
- 建议: 复核该问题是否属于 sprint-002 当前 scope；若当前窗口不处理，必须在 verified 结论中明确记录其已冻结到 `sprint-003` 的后续承接。

### 2.2 [P3] Runtime-bootstrap source catalog provenance still points at the pre-refactor CLI implementation
- 位置: `packages/standards/src/built-in-adoption-pack-catalog.ts:1198`
- 问题描述: runtime-bootstrap source catalog record 的 `sourceRef` 仍固定指向 `apps/cli/src/runtime/adoption-pack-runtime.ts#bootstrapSelfHostSurface`，但本轮 placeholder content 已迁到 `BUILT_IN_RUNTIME_BOOTSTRAP_RECORDS`。当前 provenance 无法指向实际拥有 starter content 的 standards truth surface。
- 影响: parity/support truth consumer 与后续维护者会被导向旧实现位置，弱化 sprint-002 想建立的 source catalog truthfulness。
- 建议: 将 runtime-bootstrap source catalog record 的 `sourceRef` 对齐到 `packages/standards/src/built-in-adoption-pack-catalog.ts` 内的实际 bootstrap definition，并补测试锁住。

## 3. Notes
1. 本报告基于 fresh delegated reviewer round 1 输出整理而成；主 agent 将在复核后决定 `认可 / 不认可 / 部分认可` 并同步推进 CR 生命周期。

## 4. Verification
1. `pnpm run build`（通过）
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
4. `node ./scripts/governance/run-normative-loading-manifest-gate.js`（通过）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）

## 复核结论（2026-04-15）

- 整体结论：**部分认可**

### 逐条复核
1. `2.1`
   - 判定：**不认可**
   - 证据：`project-107 / sprint-003` 的 sprint goal 与 `TK-895` / `TK-896` 产出已明确把 `doctor diagnostics`、`adopt verify`、execution preflight 的 readiness sink integration 冻结到下一 sprint；本轮 sprint-002 的承诺是 source catalog、projection assembly 与 placeholder boundary materialization，而不是 runtime sink enforcement。
   - 处理：保留为已知 follow-up，不在本轮作为 defect 修复；后续由 `TK-897` 接手 self-host readiness signals integration。
2. `2.2`
   - 判定：**认可**
   - 证据：runtime-bootstrap placeholder content 已从 CLI 硬编码迁到 `BUILT_IN_RUNTIME_BOOTSTRAP_RECORDS`，因此 `sourceRef` 继续指向 `bootstrapSelfHostSurface` 会让 source catalog provenance 落到过时位置。
   - 处理：本轮修复 runtime-bootstrap source catalog record 的 provenance，并补测试锁住 standards-side sourceRef truth。

### 验证命令
1. `pnpm run build`（通过）
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
4. `node ./scripts/governance/run-normative-loading-manifest-gate.js`（通过）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）

## 修复执行记录（2026-04-15）

1. `2.2`：已完成
   - 变更文件：`packages/standards/src/built-in-adoption-pack-catalog.ts`、`packages/standards/test/adoption-pack-registry.unit.test.ts`
   - 验证：`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`node ./scripts/governance/run-normative-loading-manifest-gate.js`（通过）
   - 说明：runtime-bootstrap source catalog record 已改为指向 built-in runtime-bootstrap provenance，而不是旧的 CLI hardcoded bootstrap source。

## 处置结果与剩余风险

1. 本轮被接受的 finding 已处理完成，`CR-001` 可以收口为 `resolved`。
2. finding `2.1` 在 verified 结论中已明确判定为不属于 sprint-002 defect 修复范围，后续继续由 `project-107 / sprint-003 / TK-897` 承接 self-host readiness sink integration。
