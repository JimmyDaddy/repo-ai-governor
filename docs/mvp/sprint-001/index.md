# MVP Sprint 001

- Status: active
- Date: 2026-03-13
- Project: `mvp`
- Sprint: `sprint-001`

## Scope

本目录用于沉淀当前 `mvp` 项目的 `sprint-001` 执行资料。

## Files

- [plan.md](./plan.md): 当前 sprint 的方案与任务拆解。
- [cli-ux-technical-solution.md](./cli-ux-technical-solution.md): CLI 体验优化的工具选型与迁移方案。
- [repository-layout-conventions.md](./repository-layout-conventions.md): `TK-101` 固化的配置目录结构与命名规范。
- [config-schema-v1.md](./config-schema-v1.md): `TK-102` 固化的治理配置 schema v1。
- [config-loading-strategy.md](./config-loading-strategy.md): `TK-103` 固化的配置加载与合并策略。
- [init-command-bootstrap.md](./init-command-bootstrap.md): `TK-104` 固化的 `init` 命令与初始化脚手架实现摘要。
- [doctor-command-runtime.md](./doctor-command-runtime.md): `TK-105` 固化的 `doctor` 命令与自检规则实现摘要。
- [project-sprint-artifact-conventions.md](./project-sprint-artifact-conventions.md): `TK-106` 固化的项目/sprint 产物目录与记录规范。
- [tasks/checklist.md](./tasks/checklist.md): 可勾选的任务执行清单。
- [tasks/tasks.csv](./tasks/tasks.csv): 任务台账。
- [tasks/TK-104.md](./tasks/TK-104.md): `TK-104` 的初始化命令任务卡。
- [tasks/TK-105.md](./tasks/TK-105.md): `TK-105` 的仓库自检命令任务卡。
- [tasks/TK-106.md](./tasks/TK-106.md): `TK-106` 的项目/sprint 产物规范任务卡。
- [tasks/TK-108.md](./tasks/TK-108.md): `TK-108` 的本地交付 skill 任务卡。
- [code-review/review_tk-001-initialize-sprint-templates.md](./code-review/review_tk-001-initialize-sprint-templates.md): `TK-001` 的 CR 记录。
- [code-review/verified_review_tk-101-design-config-layout.md](./code-review/verified_review_tk-101-design-config-layout.md): `TK-101` 的已复核 CR 记录。
- [code-review/verified_review_tk-102-design-config-schema-v1.md](./code-review/verified_review_tk-102-design-config-schema-v1.md): `TK-102` 的已复核 CR 记录。
- [code-review/verified_review_tk-103-implement-config-loader.md](./code-review/verified_review_tk-103-implement-config-loader.md): `TK-103` 的已复核 CR 记录。
- [code-review/resolved_review_tk-104-implement-init-command.md](./code-review/resolved_review_tk-104-implement-init-command.md): `TK-104` 的已解决 CR 记录。
- [code-review/verified_review_tk-105-implement-doctor-command.md](./code-review/verified_review_tk-105-implement-doctor-command.md): `TK-105` 的已复核 CR 记录。
- [code-review/verified_review_tk-106-design-project-sprint-artifacts.md](./code-review/verified_review_tk-106-design-project-sprint-artifacts.md): `TK-106` 的已复核 CR 记录。
- [code-review/verified_review_tk-108-add-workspace-delivery-skill.md](./code-review/verified_review_tk-108-add-workspace-delivery-skill.md): `TK-108` 的已复核 CR 记录。

## Notes

1. 新任务先写入 `tasks/checklist.md`，再同步 `tasks/tasks.csv` 和对应 `TK-xxx.md`。
2. 评审和复核记录统一追加到同一个 CR 文件，并放在 `code-review/` 目录。
