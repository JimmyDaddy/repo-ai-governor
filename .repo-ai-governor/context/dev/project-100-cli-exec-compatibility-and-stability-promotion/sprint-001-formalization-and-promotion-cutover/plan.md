# sprint-001-formalization-and-promotion-cutover 计划

- Status: completed
- Date: 2026-04-13
- Sprint Goal: 完成 cli-exec compatibility/stability solution 的 formal docs、registry/manifest/delivery promotion cutover，并关闭 `project-100`。
- Project: `project-100-cli-exec-compatibility-and-stability-promotion`
- Upstream:
  - `.repo-ai-governor/draft/cli-exec-compatibility-and-stability-productization-technical-solution.md`
  - `.repo-ai-governor/context/dev/project-099-cli-exec-compatibility-and-stability-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_cli-exec-compatibility-and-stability-productization.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`

## 1. Scope

1. formalize `runtime.agent-projection` overview / contract / ADR 中的 cli-exec compatibility and stability guidance
2. 将 solution 从 `approved` 切换为 `active`，并同步 delivery / module-registry / manifest
3. 完成 docs-only closeout、resolved review、artifact registry write-back 与 idle context 恢复

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-840 | activate project-100 and freeze cli-exec compatibility promotion scope | approved review + registries | completed |
| TK-841 | formalize cli-exec compatibility and stability baseline into runtime.agent-projection docs | TK-840 | completed |
| TK-842 | cut over cli-exec compatibility solution lifecycle delivery module-registry and manifest | TK-841 | completed |
| TK-843 | finalize project-100 closeout and restore idle context | TK-842 | completed |

## 3. Exit Criteria

1. `runtime.agent-projection` formal docs 已写入 cli-exec compatibility/stability producer truth。
2. lifecycle / delivery / module-registry / manifest 已同步到 promotion 后真值。
3. resolved review、artifact registry、completion audit、completed history 与 idle current-context 已完成收口。

## 4. Sprint Notes

1. 本 sprint 不复跑 `technical-solution-review`；canonical approval evidence 直接复用 `project-099` 已批准 review artifact。
2. 本 sprint 不新增 `governance.execution-gates` 正式 truth，也不修改 public support wording。
3. 本 sprint 为 docs-only promotion，不需要 `pnpm run build` 或 `pnpm -s tsc -p tsconfig.json --noEmit`。
