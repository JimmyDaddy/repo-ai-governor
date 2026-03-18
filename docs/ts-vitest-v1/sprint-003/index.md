# TS Vitest V1 Sprint 003

- Status: in-progress
- Date: 2026-03-17
- Project: `ts-vitest-v1`
- Sprint: `sprint-003`

## Scope

本迭代聚焦“硬化与收官”：在 sprint-002 全量迁移完成基础上，继续收敛 TS-only/JS 白名单边界，提升测试稳定性与覆盖率门禁，并补齐长期维护约束文档。

## Files

- [plan.md](./plan.md): 当前 sprint 的目标、范围与任务拆解。
- [tasks/checklist.md](./tasks/checklist.md): 当前 sprint 的任务执行清单。
- [tasks/tasks.csv](./tasks/tasks.csv): 当前 sprint 的执行台账。
- [tasks/TK-3001.md](./tasks/TK-3001.md): TS-only 白名单与目录边界收敛。
- [tasks/TK-3002.md](./tasks/TK-3002.md): Biome format/lint 门禁接入。
- [tasks/TK-3003.md](./tasks/TK-3003.md): Vitest 稳定性与慢测分层基线。
- [tasks/TK-3004.md](./tasks/TK-3004.md): 覆盖率基线与阈值门禁。
- [tasks/TK-3005.md](./tasks/TK-3005.md): 发布与运行时 JS 白名单收口。
- [tasks/TK-3006.md](./tasks/TK-3006.md): 迁移收官文档与长期开发约束。
- [tasks/TK-3007.md](./tasks/TK-3007.md): 收敛 literal-set whitelist 存量并分批迁移。
- [tasks/TK-3008.md](./tasks/TK-3008.md): 收敛 type-governance whitelist 存量并分批迁移。
- [tasks/TK-3009.md](./tasks/TK-3009.md): 收敛 utils-reuse whitelist 存量并清零 legacy util 豁免。
- [tasks/TK-3010.md](./tasks/TK-3010.md): 收敛 command/runtime 显式 `any` 存量并分批类型化。
- [migration-closure-report.md](./migration-closure-report.md): sprint-003 迁移收官报告与后续演进建议。
- [long-term-maintenance-guide.md](./long-term-maintenance-guide.md): sprint-003 迁移交接说明（归档入口）。
- [Repository Long-Term Maintenance Guide](../../governance/long-term-maintenance-guide.md): 仓库级长期维护与治理基线（agents 固定引用）。
- [code-review/README.md](./code-review/README.md): 当前 sprint 的 CR 目录说明。

## Notes

1. `sprint-001` 与 `sprint-002` 已完成基线建设与全量迁移，`sprint-003` 进入质量硬化阶段。
2. 默认策略保持不变：新增源码和测试优先 TypeScript，非必要不保留源码 JS。
3. 所有门禁调整都应通过 `typecheck + test + check + release:ga-check` 回归验证。
