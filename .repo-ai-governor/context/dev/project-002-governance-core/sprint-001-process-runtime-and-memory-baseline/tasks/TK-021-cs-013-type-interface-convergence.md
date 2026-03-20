# TK-021 CS-013 类型声明收敛

- Status: completed
- Date: 2026-03-20
- Owner: AI-Agent
- Priority: P1
- Project: `project-002-governance-core`
- Sprint: `sprint-001-process-runtime-and-memory-baseline`

## 1. 任务目标

按 `CS-013` 对全仓 `types/interfaces` 与 `types/aliases` 进行“按领域/上下文合并”的收敛，减少碎片化类型文件，并保持导出入口与外部引用兼容。

## 2. Depends On

1. `TK-014`
2. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md` (`CS-013`)

## 3. 预期产物

1. 类型声明收敛后的目录与导出基线（跨 `apps/` 与 `packages/`）。
2. 收敛执行记录与验证结果（`typecheck/test/check`）。

## 4. Input References

1. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
2. `.repo-ai-governor/context/dev/project-002-governance-core/plan.md`
3. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/checklist.md`

## 5. 执行记录

1. 2026-03-20：任务启动，状态切换为 `in_progress`。开始扫描 `apps/**` 与 `packages/**` 下 `types/interfaces`、`types/aliases` 的可合并点，按“领域/上下文”收敛并保持 `index.ts` 出口稳定。
2. 2026-03-20：完成全仓 CS-013 收敛。`packages/core-process` 将 14 个 interface 文件收敛为 4 个领域文件（`process-dsl`、`process-ir`、`process-ir-snapshot`、`process-compiler-issue`）；`packages/config` 将 17 个 interface 文件收敛为 4 个领域文件（`governor`、`workspace`、`workspace-migration`、`upgrade`）；`packages/core-runtime` 将 9 个 interface 文件收敛为 3 个领域文件，并将 2 个 type 文件收敛为 1 个。所有导出统一经 `types/interfaces/index.ts` 与 `types/aliases/index.ts` 聚合，验证通过 `pnpm run typecheck` 与 `pnpm run check`。
3. 2026-03-20：补齐 CR 生命周期记录，新增 `verified_review_tk-021-cs-013-type-interface-convergence.md`，并通过 `pnpm run check` 复核。
