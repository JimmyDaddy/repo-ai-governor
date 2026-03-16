# Release Ops Sprint 001

- Status: active
- Date: 2026-03-16
- Project: `release-ops`
- Sprint: `sprint-001`

## Scope

本目录用于沉淀 `release-ops` 项目的 `sprint-001` 规划与执行资料。

## Files

- [plan.md](/Users/jimmydaddy/study/repo-ai-governor/docs/release-ops/sprint-001/plan.md): 当前 sprint 的目标、范围与任务拆解。
- [release-it-publish-ci.md](/Users/jimmydaddy/study/repo-ai-governor/docs/release-ops/sprint-001/release-it-publish-ci.md): `TK-901` 的 `release-it + publish CI` 实现摘要。
- [tasks/checklist.md](/Users/jimmydaddy/study/repo-ai-governor/docs/release-ops/sprint-001/tasks/checklist.md): 当前 sprint 的任务执行清单。
- [tasks/tasks.csv](/Users/jimmydaddy/study/repo-ai-governor/docs/release-ops/sprint-001/tasks/tasks.csv): 当前 sprint 的执行台账。
- [tasks/TK-901.md](/Users/jimmydaddy/study/repo-ai-governor/docs/release-ops/sprint-001/tasks/TK-901.md): `release-it + publish CI` 集成任务卡。
- [code-review/README.md](/Users/jimmydaddy/study/repo-ai-governor/docs/release-ops/sprint-001/code-review/README.md): 当前 sprint 的 CR 目录说明。

## Notes

1. 本 sprint 的目标是把当前“发布候选”状态推进到“具备真实 publish CI”的状态。
2. 重点是让 `release-it`、GitHub Release 和 npm publish 形成可验证闭环，同时保留现有 `release:ga-check` 门禁。
