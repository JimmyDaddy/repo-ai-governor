# Code Review: sprint-001-parity-catalog-and-readiness-foundation round 1

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
1. `packages/standards/src/built-in-adoption-pack-catalog.ts`
2. `packages/standards/src/adoption-pack-registry.ts`
3. `packages/standards/src/constants/adoption-pack.constant.ts`
4. `packages/standards/src/types/interfaces/adoption-pack.interface.ts`
5. `packages/standards/test/adoption-pack-registry.unit.test.ts`
6. `project-107 / sprint-001` task-ledger surfaces

## 2. Findings
### 2.1 [P1] Structured-template starters drifted from the claimed exact-sync schema
- 位置: `packages/standards/src/built-in-adoption-pack-catalog.ts:290`
- 问题描述: `current-context.md` starter 仍停留在旧的 `Docs root / Task records / Review records` skeleton；`normative-loading-manifest.yaml` starter 也只保留了最小字段集，没有跟当前 startup baseline 的 external inputs 和 L0 document metadata 对齐，但 source catalog 却把这两条 surface 标成了 `exact_sync + structured_template_projection`。
- 影响: 这会把“结构对齐、实例占位”的 contract 说成已满足，后续 parity/readiness consumer 会在错误前提上继续推进。
- 建议: 把两份 starter 调整到当前结构真值，再让测试同时检查 label 与 starter structure。

### 2.2 [P2] Source catalog 漏记了 runtime bootstrap 写出的 governor config
- 位置: `packages/standards/src/built-in-adoption-pack-catalog.ts:728`
- 问题描述: `bootstrapSelfHostSurface()` 会实际写出 `.repo-ai-governor/governor.yaml`，但首版 `sourceCatalogRecords` 只覆盖了 module registry、governance docs 与 sqlite/artifact-registry surfaces，没有把这条 bootstrap surface 纳入 inventory。
- 影响: sprint-001 声称冻结了 built-in/self-host parity inventory，但实际仍缺一条核心 runtime bootstrap seam，后续 parity/readiness consumer 无法完整推理。
- 建议: 将 `.repo-ai-governor/governor.yaml` 作为 runtime-bootstrap source catalog record 补齐，并补单测锁住它。

## 3. Notes
1. 上述 finding 来自 delegated reviewer round 1；主 agent 采纳并在同一 change window 内完成修复闭环。

## 4. Verification
1. `pnpm run build`（通过）
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/governance/run-normative-loading-manifest-gate.js`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）

## 复核结论（2026-04-15）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`current-context.md` starter 已补齐 `Stream / Plan / Tasks / Checklist / CSV / Review / Update Rules` 结构；`normative-loading-manifest.yaml` starter 已补齐 lifecycle/delivery external inputs 与 L0 document metadata；测试也改为直接检查这些结构字段存在。
   - 处理：保留 `exact_sync + structured_template_projection` label，并将 starter structure 对齐到当前真值。
2. `2.2`
   - 判定：**认可**
   - 证据：`sourceCatalogRecords` 已新增 `.repo-ai-governor/governor.yaml` runtime-bootstrap inventory，相关单测已断言该 surface 存在。
   - 处理：补齐 inventory 漏项，避免后续 parity/readiness consumer 继续漏掉 governor config。

### 验证命令
1. `pnpm run build`（通过）
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/governance/run-normative-loading-manifest-gate.js`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）

## 修复执行记录（2026-04-15）

1. `2.1`：已完成
   - 变更文件：`packages/standards/src/built-in-adoption-pack-catalog.ts`、`packages/standards/test/adoption-pack-registry.unit.test.ts`
   - 验证：`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`node ./scripts/governance/run-normative-loading-manifest-gate.js`（通过）
   - 说明：starter current-context / manifest 结构已经对齐到当前 startup baseline，再由 template instance values 承担占位语义。
2. `2.2`：已完成
   - 变更文件：`packages/standards/src/built-in-adoption-pack-catalog.ts`、`packages/standards/test/adoption-pack-registry.unit.test.ts`
   - 验证：`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`node ./scripts/governance/run-normative-loading-manifest-gate.js`（通过）
   - 说明：`.repo-ai-governor/governor.yaml` 已进入 runtime-bootstrap source catalog inventory，并有测试覆盖。

## 处置结果与剩余风险

1. 本轮 delegated review 的 actionable findings 已全部处理完成。
2. 剩余 follow-up 已明确保留到 sprint-002 / sprint-003：catalog-driven assembly、runtime sink integration 与 consumer docs truthfulness refresh，不属于本轮遗留 defect。
