# TK-014 Runtime 控制流执行基线

- Status: in_progress
- Date: 2026-03-20
- Owner: AI-Agent
- Priority: P0
- Project: `project-002-governance-core`
- Sprint: `sprint-001-process-runtime-and-memory-baseline`

## 1. 任务目标

建立 Runtime 控制流执行基线，覆盖 `Sequential/Parallel/Loop/Condition` 与跳步限制、重试/超时/取消基础语义。

## 2. Depends On

1. `TK-013`
2. `DA-020`
3. `DA-019`

## 3. 预期产物

1. `DA-021` runtime control flow baseline 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/TK-013-process-dsl-and-compiler-ir-v1-baseline.md` (`DA-020`)
2. `.repo-ai-governor/context/dev/project-001-foundation/sprint-002-workspace-and-upgrade/tasks/TK-012-stage-2-input-readiness-checklist.md` (`DA-019`)
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md` (`§5.2 ~ §5.5`)
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`（执行时序图与分层依赖约束）

## 5. 执行记录

1. 2026-03-20：任务启动，进入 `in_progress`。当前正在落地 `packages/core-runtime` 控制流执行骨架（Sequential/Parallel/Loop/Condition）与基础中断语义（timeout/cancelled）。
2. 2026-03-20：已处理 runtime review 评论。去除默认超时/阈值常量中的数字分隔符；将 `RuntimeNowProvider` 从函数 type 升级为可扩展抽象类，并新增 `DefaultRuntimeNowProvider` 默认实现；`ProcessRuntimeEngine` 改为通过 `nowProvider.now()` 采样时钟，并补充可扩展 provider 的 smoke 用例。验证通过 `pnpm run typecheck`、`pnpm run test -- process-runtime-engine.smoke.test.ts`、`pnpm run check`。
3. 2026-03-20：已完成 `review_tk-014-runtime-control-flow-engine-baseline.md` 复核，复核结论为“部分认可”，并将报告推进为 `verified_review_tk-014-runtime-control-flow-engine-baseline.md`。复核后确认 0 个阻断项；验证通过 `pnpm run typecheck`、`pnpm run test -- process-runtime-engine.smoke.test.ts`、`pnpm run check`。
