# Code Review: TK-099 Working Tree Follow-Up

- Status: resolved
- Date: 2026-03-24
- Reviewer: AI-Agent
- Task: `TK-099`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/plan.md`
4. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/TK-099-task-driven-dag-and-run-mainchain-assembly.md`
5. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/checklist.md`
6. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/tasks.csv`
7. `apps/cli/src/cli-governance-runtime.ts`
8. `apps/cli/src/runtime/task-driven-run-runtime.ts`
9. `apps/cli/src/constants/cli-task-driven-run.constant.ts`
10. `apps/cli/src/types/interfaces/cli-task-driven-run.interface.ts`
11. `apps/cli/src/types/index.ts`
12. `apps/cli/src/types/interfaces/index.ts`
13. `apps/cli/test/cli-governance-runtime.integration.test.ts`
14. `apps/cli/test/runtime/task-driven-run-runtime.test.ts`
15. `.repo-ai-governor/draft/task-execution-context-growth-analysis.md`

## 2. Findings
### 2.1 [P2] Task card section parsing is brittle to heading-number drift
- 位置: `apps/cli/src/runtime/task-driven-run-runtime.ts:77`
- 问题描述: `resolveTaskCardContext()` 只会按精确标题 `## 1. 任务目标`、`## 2. Depends On`、`## 4. Input References` 提取 section，`extractSection()` 也只接受固定数字前缀。仓库里已经存在 `## 2.1 Depends On` / `## 2.2 Input References` 这类合法 task card 结构（例如 `project-001/.../TK-001-project-splitting-baseline.md:21-30`），而治理脚本 `check-artifact-registry-lifecycle.js` 也明确把“heading numbering can drift”当作兼容前提。当前实现遇到这类 task card 时会静默得到空的 `goal/dependsOn/inputArtifacts`，但仍返回 `task_context_loaded` 的 task-driven assembly。
- 影响: `run --task-id <TK>` 在现有 task card 语料上并不稳定，可能无提示地丢失依赖任务和输入产物，进一步把本应存在的 artifact-context / verify 阶段组装成错误的 DAG。
- 建议: 改为按 section 标题语义匹配（如 `任务目标` / `Depends On` / `Input References`），不要绑定固定编号；并补一条 `2.1/2.2` heading 形式的回归测试。

### 2.2 [P2] Formal handoff inputs without `DA-*` are dropped from task-driven stage inputs
- 位置: `apps/cli/src/runtime/task-driven-run-runtime.ts:179`
- 问题描述: `extractInputArtifacts()` 只保留含有 `DA-\d{3}` 的输入行，而 `commonTaskContextPayload` 也只把 `inputArtifacts` 注入 stage inputs。可 `project-010` 计划已明确要求 sprint-002 消费 `DA-121`、`DA-122`、`DA-123` 与 `project-011-cli-package-decomposition-completion-audit-summary.md`，`TK-099` 的 `Input References` 也确实把 completion audit summary 列为正式输入。当前解析会把这条 summary 路径直接丢掉，后续 stage handler 和命令输出细节都看不到这部分 handoff 上下文。
- 影响: task-driven `run` 从第一版骨架开始就携带了不完整的正式输入集，后续若按 `stageInputs.inputArtifacts` 做依赖注入、解释或审计，会系统性漏掉非 `DA-*` 的 handoff 文档。
- 建议: 除 artifact-only 结构外，再保留完整的 `inputReferences`（或至少保留非 `DA-*` 的 required inputs）进入 task context / stage inputs，并补一条包含 completion audit summary 的解析断言。

## 3. Notes
1. `TK-099` 的台账、sprint 状态和 `current-context` 切换本轮是同步的；`check-task-ledger-sync` 与 `check-sprint-plan-status-sync` 都通过。
2. 新增的 `.repo-ai-governor/draft/task-execution-context-growth-analysis.md` 当前更像探索性分析输入，我没有把它单独升为 formal finding。

## 4. Verification
1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm -s vitest run apps/cli/test/runtime/task-driven-run-runtime.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `pnpm run check`（未执行）

## 复核结论（2026-03-24）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P2] Task card section parsing is brittle to heading-number drift`
   - 判定：**认可**
   - 证据：`task-driven-run-runtime` 已改为按 section 标题语义提取 `任务目标`、`Depends On`、`Input References`，不再绑定固定编号；同时补了 `## 2.1 Depends On` / `## 2.2 Input References` 的回归测试。
   - 处理：已修复，heading numbering drift 不再导致 task-driven assembly 静默丢上下文。
2. `2.2 [P2] Formal handoff inputs without \`DA-*\` are dropped from task-driven stage inputs`
   - 判定：**认可**
   - 证据：task context 现已同时保留 `inputReferences` 与 `inputArtifacts` 两层结构，非 `DA-*` 的 completion audit summary 会随 `stageInputs` 和 `processDefinition.globals.taskContext` 一起透传。
   - 处理：已修复，task-driven `run` 不再只保留 artifact 子集。

### 验证命令
1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm -s vitest run apps/cli/test/runtime/task-driven-run-runtime.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
6. `pnpm run check`（通过）

## 修复执行记录（2026-03-24）

1. `2.1 [P2] Task card section parsing is brittle to heading-number drift`：已完成
   - 变更文件：`apps/cli/src/runtime/task-driven-run-runtime.ts`、`apps/cli/test/runtime/task-driven-run-runtime.test.ts`、`apps/cli/test/cli-governance-runtime.integration.test.ts`
   - 验证：`pnpm -s tsc -p tsconfig.json --noEmit && pnpm -s vitest run apps/cli/test/runtime/task-driven-run-runtime.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：section 解析已切到语义匹配，`2.1/2.2` 这类 heading 也能稳定抽出 task goal、依赖任务和输入引用。
2. `2.2 [P2] Formal handoff inputs without \`DA-*\` are dropped from task-driven stage inputs`：已完成
   - 变更文件：`apps/cli/src/types/interfaces/cli-task-driven-run.interface.ts`、`apps/cli/src/types/index.ts`、`apps/cli/src/types/interfaces/index.ts`、`apps/cli/src/runtime/task-driven-run-runtime.ts`、`apps/cli/src/cli-governance-runtime.ts`、`apps/cli/test/runtime/task-driven-run-runtime.test.ts`、`apps/cli/test/cli-governance-runtime.integration.test.ts`
   - 验证：`node ./scripts/governance/check-task-ledger-sync.js && node ./scripts/governance/check-sprint-plan-status-sync.js && node ./scripts/governance/check-code-review-status-sync.js && pnpm run check`（通过）
   - 说明：`inputReferences` 现已作为 formal handoff 上下文保留到 `taskContext`、`stageInputs` 和 CLI 组装细节中，`inputArtifacts` 仅保留 artifact 子集。
