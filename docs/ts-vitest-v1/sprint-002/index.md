# TS Vitest V1 Sprint 002

- Status: done
- Date: 2026-03-17
- Project: `ts-vitest-v1`
- Sprint: `sprint-002`

## Scope

本迭代聚焦“全量迁移推进 + 规则收口”：将剩余核心源码与测试从 JS 迁移到 TS，收敛临时兼容策略，并把 TS-only 约束固化到日常 gate。

## Files

- [plan.md](./plan.md): 当前 sprint 的目标、范围与任务拆解。
- [tasks/checklist.md](./tasks/checklist.md): 当前 sprint 的任务执行清单。
- [tasks/tasks.csv](./tasks/tasks.csv): 当前 sprint 的执行台账。
- [tasks/TK-2001.md](./tasks/TK-2001.md): 试点模块类型收敛与 `@ts-nocheck` 清理。
- [tasks/TK-2002.md](./tasks/TK-2002.md): `workflow/slots/standards/config` 迁移批次。
- [tasks/TK-2003.md](./tasks/TK-2003.md): `adapters/skills` 与示例脚本迁移批次。
- [tasks/TK-2004.md](./tasks/TK-2004.md): `cli/commands` 迁移批次。
- [tasks/TK-2005.md](./tasks/TK-2005.md): 测试层 `.test.js -> .test.ts` 收敛批次。
- [tasks/TK-2006.md](./tasks/TK-2006.md): TS-only gate 与发布收口批次。
- [code-review/README.md](./code-review/README.md): 当前 sprint 的 CR 目录说明。

## Notes

1. `sprint-001` 已完成基线建设与试点验证，`sprint-002` 进入“规模化迁移”阶段。
2. 本迭代默认策略：新增代码与改造代码优先 TypeScript，非必要不保留源码 JS。
3. 每个批次均要求通过 `typecheck + test + check (+ release gate when applicable)`。
