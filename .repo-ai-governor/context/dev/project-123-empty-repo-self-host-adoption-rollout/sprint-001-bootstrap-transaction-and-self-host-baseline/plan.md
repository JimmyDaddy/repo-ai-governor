# sprint-001-bootstrap-transaction-and-self-host-baseline 计划

- Status: completed
- Date: 2026-05-13
- Sprint Goal: 修复 empty-repo self-host first-run bootstrap/apply 冲突并补齐最小 self-host baseline
- Project: `project-123-empty-repo-self-host-adoption-rollout`
- Upstream:
  - `.repo-ai-governor/context/dev/project-122-empty-repo-self-host-adoption-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-1052-empty-repo-self-host-adoption-promotion-and-rollout-decomposition-handoff.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/empty-repo-self-host-adoption-follow-up.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adoption-pack-installer-and-self-host-template-bootstrap.md`
  - `.repo-ai-governor/draft/approved_solution_review_empty-repo-self-host-adoption-follow-up.md`

## 1. Scope

1. 修复 bootstrap transaction 中 governor.yaml seed/apply 一致性，避免 empty repo self-host first-run 因同事务 config seed 与 managed apply 冲突直接 fail-closed。
2. 为 self-host repo_local path 提供最小 adapters/storage baseline，确保 `connect`、`doctor` 与 `run --dry-run --trace` 进入受支持的 first-run path。
3. 为 sprint-002 的 ownership/drift policy 实现冻结可验证的 first-hop runtime baseline 与 closeout handoff。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-1054 | fix empty-repo self-host bootstrap transaction and managed apply boundary | approved solution review | completed |
| TK-1055 | seed minimal self-host adapters and storage baseline | fix empty-repo self-host bootstrap transaction and managed apply boundary | completed |
| TK-1056 | close sprint-001 and hand off ownership policy implementation | seed minimal self-host adapters and storage baseline | completed |

## 3. Exit Criteria

1. empty repo self-host-complete + repo_local 不再因 governor.yaml unmanaged collision 或 adapters baseline 缺失而在 first-run path fail-closed。
2. sprint-001 的实现输入、closeout handoff 与后续 ownership policy activation boundary 已固定到 canonical task cards。

## 4. Sprint Notes

1. bootstrap 阶段不预生成 code_review 生命周期文件。
2. 若用户只要求拆解，不自动修改 current-context.md。
3. 默认将该 sprint 作为首个 activation candidate，但只有在用户显式要求时才切为 active。
4. 2026-05-14：`TK-1054/TK-1055` 已完成实现与定向验证；当前 sprint 剩余工作为 fresh reviewer CR round、accepted fix loop、closeout handoff 与 boundary commit。
5. 2026-05-14：`CR-003` 已 clean `resolved`；`TK-1056 / DA-1056` 已完成 sprint-001 closeout write-back，并将 `current-context` 切换到 `sprint-002` 作为新的 primary execution surface。
