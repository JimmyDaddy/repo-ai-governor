# sprint-002-failure-path-coverage-and-rollout-closeout 计划

- Status: planned
- Date: 2026-04-14
- Sprint Goal: 扩展 failure-path coverage，完成 compatibility-aligned evidence 与 rollout closeout。
- Project: `project-102-cli-exec-launch-authoring-contract-tests-rollout`
- Upstream:
  - `.repo-ai-governor/context/dev/project-102-cli-exec-launch-authoring-contract-tests-rollout/sprint-001-launch-authoring-contract-tests-rollout/plan.md`
  - `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/plan.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/adapter-authored-launch-plan-ownership-and-contract-tests.md`

## 1. Scope

1. 将 launch-authoring contract coverage 扩展到 `spawn / parse / non_zero / signal / timeout / abort` 等 failure-path。
2. 证明 launch-authoring coverage 与 compatibility baseline 对齐，但不扩面成通用 adapter test strategy。
3. 在 sprint final clean 后完成 `project-102` closeout 与 delivery evidence handoff。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-869 | extend launch-authoring contract coverage across spawn parse non-zero signal timeout and abort paths | TK-868 | planned |
| TK-870 | prove compatibility-baseline alignment without widening scope into general adapter test strategy | TK-869 | planned |
| TK-871 | finalize project-102 closeout and delivery evidence handoff | TK-869、TK-870、activation-time local CR-001 | planned |

## 3. Exit Criteria

1. failure-path coverage 已完整进入 shared launch-authoring contract-test rollout boundary。
2. compatibility baseline alignment 已形成可复用 evidence，而非停留在口头依赖关系。
3. 激活该 sprint 时有清晰的本地 `CR-001` 入口与 project-final closeout 边界。

## 4. Sprint Notes

1. 激活后先预留本地 `CR-001`，再开始 implementation 与 reviewer loop。
2. 当前 sprint 只承接 failure-path coverage、alignment evidence 与 closeout，不新增 general adapter test strategy 范围。
3. `TK-871` 负责 `project-102` final closeout，但只有在 sprint-002 local `CR-001` clean 后才允许完成。
