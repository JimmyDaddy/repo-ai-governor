# TK-076 本地调试（dry-run/trace/replay）与诊断输出基线

- Status: planned
- Date: 2026-03-22
- Owner: TBD
- Priority: P0
- Project: `project-009-production-readiness`
- Sprint: `sprint-001-local-adoption-and-install-readiness`

## 1. 任务目标

建立本地调试与诊断输出能力，支持开发者快速复现、定位与验证问题，并为 Stage 9B 的无人值守链路提供可归因的本地诊断基线。

## 2. Depends On

1. `TK-075`

## 3. 预期产物

1. `DA-088` 本地调试与诊断输出基线产物文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
4. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
5. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 5. 实施计划

1. 定义 `dry-run/trace/replay` 的输入、输出与行为边界，并覆盖本地安装、clean-room 复现、只读接入预检、workspace 切换回滚与 provider/mock 切换等 Stage 9A 诊断场景。
2. 增加分层诊断输出：摘要、关键事件、阶段耗时、策略判定依据、adapter 调用摘要、错误上下文、下一步建议。
3. 对 `review -> review-verify -> ledger backfill` 关键链路建立可归因诊断字段，确保 Stage 9B rehearsal 中断能区分策略/HITL、环境前置、权限确认与运行时缺陷。
4. 建立“问题复现 -> 定位 -> 修复验证”流程模板，并确保输出字段可被 `DA-092` 用于 Stage 9B rehearsal 失败归因。
5. 回写台账并登记可复用产物。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`

## 7. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：根据 `TK-088` 补齐 Stage 9A 诊断字段与 Stage 9B 失败归因交接语义，任务状态保持 `planned`。
3. 2026-03-22：根据 `TK-090` 补齐只读接入、workspace rollback 与 `review-verify` 链路的诊断归因字段，任务状态保持 `planned`。

## 8. 产出

1. `DA-088` `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-076-local-debug-trace-replay-and-diagnostics-baseline.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/tasks.csv`
