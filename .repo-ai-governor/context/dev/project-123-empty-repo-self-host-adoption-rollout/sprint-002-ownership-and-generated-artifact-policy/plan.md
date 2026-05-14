# sprint-002-ownership-and-generated-artifact-policy 计划

- Status: completed
- Date: 2026-05-13
- Sprint Goal: 引入 ownership class、drift policy、receipt metadata 与 generated artifact ignore policy
- Project: `project-123-empty-repo-self-host-adoption-rollout`
- Upstream:
  - `.repo-ai-governor/context/dev/project-122-empty-repo-self-host-adoption-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-1052-empty-repo-self-host-adoption-promotion-and-rollout-decomposition-handoff.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/empty-repo-self-host-adoption-follow-up.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adoption-pack-installer-and-self-host-template-bootstrap.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/built-in-adoption-pack-parity-and-self-host-readiness-sync.md`

## 1. Scope

1. 将 managed_locked/starter_editable/canonical_runtime_writable/generated_ephemeral ownership taxonomy 落到 receipt provenance、drift semantics 与 lifecycle boundary。
2. 把 upgrade/remove 与 gitignore recommendation 收敛到 opt-in、non-destructive 的 self-host policy 路径，避免把 adopter-owned / runtime-writable surface 继续误判成 install drift。
3. 为 sprint-003 固定 activation/readiness owner split 的首跳输入面。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-1057 | implement self-host ownership classes and receipt metadata baseline | close sprint-001 and hand off ownership policy implementation | completed |
| TK-1058 | align drift upgrade remove and gitignore recommendation semantics | implement self-host ownership classes and receipt metadata baseline | completed |
| TK-1059 | close sprint-002 and hand off activation readiness work | align drift upgrade remove and gitignore recommendation semantics | completed |

## 3. Exit Criteria

1. receipt、drift 与 remove/upgrade 语义已能区分 writable canonical truth 与 generated artifacts，且 gitignore recommendation 保持 opt-in boundary。
2. sprint-002 closeout handoff 已把 activation/readiness implementation 所需的正式输入收敛到 canonical task cards。

## 4. Sprint Notes

1. bootstrap 阶段不预生成 code_review 生命周期文件。
2. 若用户只要求拆解，不自动修改 current-context.md。
3. 2026-05-14：该 sprint 已作为 `current-context.md` 的 active primary execution surface 执行中；closeout 前保持 `active` 真值。
4. 2026-05-14：`CR-005` clean `resolved` 后，`TK-1059 / DA-1059` 已完成 closeout write-back，并将 primary execution surface 切换到 `sprint-003-activation-and-readiness-ux`。
