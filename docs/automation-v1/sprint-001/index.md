# Automation V1 Sprint 001

- Status: active
- Date: 2026-03-16
- Project: `automation-v1`
- Sprint: `sprint-001`

## Scope

本 sprint 聚焦“受控自动化基线”：把已有治理命令链路升级为可编排执行流，并补齐权限门禁、审计日志和验收路径。

## Files

- [plan.md](./plan.md): 当前 sprint 的目标、范围与任务拆解。
- [automation-controller-model.md](./automation-controller-model.md): 自动化控制器模型、状态机与 preflight 契约。
- [multi-ai-handoff-orchestration-solution.md](./multi-ai-handoff-orchestration-solution.md): 多 AI 角色自动分工与交接触发方案。
- [default-and-custom-orchestration-solution.md](./default-and-custom-orchestration-solution.md): 默认流程与用户自编排双轨方案。
- [tasks/checklist.md](./tasks/checklist.md): 当前 sprint 的任务执行清单。
- [tasks/tasks.csv](./tasks/tasks.csv): 当前 sprint 的执行台账。
- [tasks/TK-951.md](./tasks/TK-951.md): 自动化控制器模型任务卡。
- [tasks/TK-952.md](./tasks/TK-952.md): `run` 命令实现任务卡。
- [tasks/TK-953.md](./tasks/TK-953.md): 权限分级与高风险门禁任务卡。
- [tasks/TK-954.md](./tasks/TK-954.md): 审计日志与恢复检查点任务卡。
- [tasks/TK-955.md](./tasks/TK-955.md): 多 AI 自动化验收与 CI smoke gate 任务卡。
- [tasks/TK-956.md](./tasks/TK-956.md): 编排解释输出任务卡。
- [tasks/TK-957.md](./tasks/TK-957.md): 流程配置校验与解释入口任务卡。
- [code-review/README.md](./code-review/README.md): 当前 sprint 的 CR 目录说明。
- [code-review/verified_review_tk-952-implement-run-command.md](./code-review/verified_review_tk-952-implement-run-command.md): `TK-952` 的已复核 CR 记录。

## Notes

1. 该 sprint 以“安全可控”为第一优先级，不直接追求完全无人值守。
2. 所有任务执行记录需同步追加到 `checklist.md` 与 `tasks.csv`。
