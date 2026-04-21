# TK-1024 remediate artifact registry lifecycle backlog and refresh canonical views

- Status: completed
- Date: 2026-04-21
- Owner: AI-Agent
- Priority: P0
- Project: `project-117-artifact-lifecycle-and-gate-contract-remediation`
- Sprint: `sprint-001-backlog-clearance-and-doc-truth-alignment`

## 1. 任务目标

清理当前阻塞 `pnpm run check` 的 artifact lifecycle backlog，并确保 canonical sqlite 与 rendered CSV views 同步收口。

## 2. Depends On

1. `TK-1023`

## 3. 预期产物

1. 更新后的 `.repo-ai-governor/context/artifact-registry/sqlite/artifact-registry.sqlite`
2. 更新后的 `.repo-ai-governor/context/artifact-registry/artifacts.csv`
3. 更新后的 `.repo-ai-governor/context/artifact-registry/archive/artifacts.archive.csv`
4. `.repo-ai-governor/context/dev/project-117-artifact-lifecycle-and-gate-contract-remediation/sprint-001-backlog-clearance-and-doc-truth-alignment/project-117-sprint-001-artifact-lifecycle-maintenance-summary.json`

## 4. Required Inputs

1. .repo-ai-governor/context/artifact-registry/artifacts.csv
2. .repo-ai-governor/normative_knowledge_sources/governance/code_standards.md
3. scripts/governance/check-artifact-registry-lifecycle.js
4. scripts/governance/run-artifact-lifecycle-maintenance.js

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-117-artifact-lifecycle-and-gate-contract-remediation/plan.md
2. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-117-artifact-lifecycle-and-gate-contract-remediation/sprint-001-backlog-clearance-and-doc-truth-alignment/tasks/TK-1023-capture-current-improvement-summary-draft-and-activate-remediation-stream.md

## 6. 实施计划

1. 先对 artifact lifecycle maintenance 跑 dry-run summary，确认预计变更。
2. 以 canonical maintenance 脚本更新 sqlite 与 rendered views。
3. 重新运行 artifact lifecycle gate 与全仓 `check`，确认 backlog 已不再阻塞。

## 7. Development Verification

1. node ./scripts/governance/run-artifact-lifecycle-maintenance.js --dry-run --summary-file .repo-ai-governor/context/dev/project-117-artifact-lifecycle-and-gate-contract-remediation/sprint-001-backlog-clearance-and-doc-truth-alignment/project-117-sprint-001-artifact-lifecycle-maintenance-dry-run.json
2. node ./scripts/governance/check-artifact-registry-lifecycle.js

## 8. Delivery Verification

1. node ./scripts/governance/check-artifact-registry-lifecycle.js
2. pnpm run check（已执行；若仍失败，仅允许保留为 scope 外 dirty-worktree drift，并需在执行记录中明确指出）

## 9. 执行记录

1. 2026-04-21：任务创建，状态初始化为 `planned`。
2. 2026-04-21：已完成 artifact lifecycle dry-run，summary 显示本轮 canonical maintenance 将新增 `7` 个 `deprecated` 并把 `9` 个条目移入 archive，且 `unresolvedArtifactDependencyRefs=0`。
3. 2026-04-21：已执行 canonical artifact lifecycle maintenance 并写入 `project-117-sprint-001-artifact-lifecycle-maintenance-summary.json`；`check-artifact-registry-lifecycle.js` 恢复通过。`pnpm run check` 已不再被 artifact lifecycle 阻塞，当前剩余失败仅来自 scope 外 dirty worktree 中的 biome format drift。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-117-artifact-lifecycle-and-gate-contract-remediation/sprint-001-backlog-clearance-and-doc-truth-alignment/project-117-sprint-001-artifact-lifecycle-maintenance-dry-run.json`
2. `.repo-ai-governor/context/dev/project-117-artifact-lifecycle-and-gate-contract-remediation/sprint-001-backlog-clearance-and-doc-truth-alignment/project-117-sprint-001-artifact-lifecycle-maintenance-summary.json`
3. `.repo-ai-governor/context/artifact-registry/sqlite/artifact-registry.sqlite`
4. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
5. `.repo-ai-governor/context/artifact-registry/archive/artifacts.archive.csv`
