# Release Ops Sprint 001

- Status: done
- Date: 2026-03-16
- Project: `release-ops`
- Sprint: `sprint-001`

## Scope

本目录用于沉淀 `release-ops` 项目的 `sprint-001` 规划与执行资料。

## Files

- [plan.md](./plan.md): 当前 sprint 的目标、范围与任务拆解。
- [release-it-publish-ci.md](./release-it-publish-ci.md): `TK-901` 的 `release-it + publish CI` 实现摘要。
- [tasks/checklist.md](./tasks/checklist.md): 当前 sprint 的任务执行清单。
- [tasks/tasks.csv](./tasks/tasks.csv): 当前 sprint 的执行台账。
- [tasks/TK-901.md](./tasks/TK-901.md): `release-it + publish CI` 集成任务卡。
- [code-review/README.md](./code-review/README.md): 当前 sprint 的 CR 目录说明。

## Notes

1. 本 sprint 的目标是把当前“发布候选”状态推进到“具备真实 publish CI”的状态。
2. 重点是让 `release-it`、GitHub Release 和 npm publish 形成可验证闭环，同时保留现有 `release:ga-check` 门禁。

## Closure

1. 当前 sprint 已完成并收口，任务状态与台账已同步到 `tasks/checklist.md` 和 `tasks/tasks.csv`。
2. 后续进入 `automation-v1 / sprint-001` 新主线。
