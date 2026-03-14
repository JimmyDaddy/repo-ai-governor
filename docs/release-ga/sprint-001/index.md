# Release GA Sprint 001

- Status: done
- Date: 2026-03-14
- Project: `release-ga`
- Sprint: `sprint-001`

## Scope

本目录用于沉淀 `release-ga` 项目的 `sprint-001` 规划与执行资料。

## Files

- [plan.md](./plan.md): 当前 sprint 的目标、范围、里程碑和任务拆解。
- [ga-release-flow.md](./ga-release-flow.md): `TK-701` 的正式发布流程与版本策略说明。
- [readme-and-quick-start.md](./readme-and-quick-start.md): `TK-702` 的对外文档与上手路径实现摘要。
- [remote-release-automation.md](./remote-release-automation.md): `TK-703` 的远端发布自动化骨架与前置条件说明。
- [ten-minute-getting-started.md](./ten-minute-getting-started.md): `TK-704` 的 10 分钟上手验收路径实现摘要。
- [tasks/checklist.md](./tasks/checklist.md): 当前 sprint 的任务执行清单。
- [tasks/tasks.csv](./tasks/tasks.csv): 当前 sprint 的执行台账。
- [tasks/TK-701.md](./tasks/TK-701.md): `TK-701` 的正式发布流程与版本策略任务卡。
- [tasks/TK-702.md](./tasks/TK-702.md): `TK-702` 的 README / Quick Start 任务卡。
- [tasks/TK-703.md](./tasks/TK-703.md): `TK-703` 的远端 release / tag / changelog 自动化任务卡。
- [tasks/TK-704.md](./tasks/TK-704.md): `TK-704` 的 10 分钟上手验收路径任务卡。
- [code-review/README.md](./code-review/README.md): 当前 sprint 的 CR 目录说明。
- [code-review/verified_review_tk-701-establish-ga-release-flow.md](./code-review/verified_review_tk-701-establish-ga-release-flow.md): `TK-701` 的已复核 CR 记录。
- [code-review/verified_review_tk-702-author-readme-and-quick-start.md](./code-review/verified_review_tk-702-author-readme-and-quick-start.md): `TK-702` 的已复核 CR 记录。
- [code-review/verified_review_tk-703-build-remote-release-automation.md](./code-review/verified_review_tk-703-build-remote-release-automation.md): `TK-703` 的已复核 CR 记录。
- [code-review/verified_review_tk-704-build-ten-minute-getting-started.md](./code-review/verified_review_tk-704-build-ten-minute-getting-started.md): `TK-704` 的已复核 CR 记录。
- [code-review/verified_review_tk-701-tk-702-bilingual-release-docs.md](./code-review/verified_review_tk-701-tk-702-bilingual-release-docs.md): `TK-701 / TK-702` 的双语发布文档与收口复核记录。

## Notes

1. `release-ga` 项目的目标是把当前 MVP 从“可发布候选”推进到“对外可试用、可发布、可形成真实反馈”的状态。
2. `TK-701` 已完成，当前已补齐正式发布流程、版本策略、`CHANGELOG.md`、`CHANGELOG.zh-CN.md` 和 GA 级 release check 约束。
3. `TK-702` 已完成，当前已补齐根目录 `README.md`、`README.zh-CN.md`、Quick Start、示例上手文档，并把双语 `README` 纳入 release readiness 检查。
4. `TK-703` 已完成，当前已补齐远端 release workflow 骨架、release notes 渲染脚本和相关自动校验。
5. `TK-704` 已完成，当前已补齐 10 分钟上手文档、示例输入与验收记录模板，以及本地打包安装后的端到端 smoke 路径。
6. `release-ga / sprint-001` 已正式收口，当前仓库处于无活动 sprint 的待规划状态。
