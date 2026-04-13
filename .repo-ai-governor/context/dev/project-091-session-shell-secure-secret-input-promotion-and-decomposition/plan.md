# project-091-session-shell-secure-secret-input-promotion-and-decomposition 计划

- Status: completed
- Date: 2026-04-12
- Stage Mapping: technical solution review / promotion / follow-up decomposition
- Phase Mapping: draft remediation and approval / formal cutover / planned rollout decomposition
- Upstream:
  - `.repo-ai-governor/draft/session-shell-secure-secret-input-and-redacted-command-handoff-technical-solution.md`
  - `.repo-ai-governor/context/dev/project-090-session-shell-secure-secret-input-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_session-shell-secure-secret-input-and-redacted-command-handoff.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/local-user-config-and-secret-command-contract.md`

## 1. 目标

1. 修订 `technical-solution.session-shell-secure-secret-input-and-redacted-command-handoff` draft，清除上一轮 review 的两条 blocking finding。
2. 在同一 docs-only 窗口完成 clean re-review，把 lifecycle 从 `review_pending` 推进到 `approved`，再正式 promotion 为 `active`。
3. 把当前 solution 的 formal scope 收敛为 Phase A，并将真实实现拆解为 planned rollout stream `project-092-session-shell-secure-secret-input-rollout`。

## 2. Sprint 细化

## 2.1 sprint-001-review-promotion-and-followup-decomposition

- Status: completed
- Sprint Goal: 完成 secure secret input solution 的 draft remediation、approval、formal promotion 与 planned rollout decomposition。
- Task Package: `TK-802`、`TK-803`、`TK-804`、`TK-805`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-802 | sprint-001 | activate project-091 and freeze session-shell secure secret input scope | governance/bootstrap | prior review artifact + draft | completed |
| TK-803 | sprint-001 | remediate draft and approve session-shell secure secret input solution | docs/review + lifecycle | TK-802 | completed |
| TK-804 | sprint-001 | promote secure secret input solution and decompose planned rollout into project-092 | docs/promotion + planning/decomposition | TK-803 | completed |
| TK-805 | sprint-001 | finalize project-091 closeout and register the new planned follow-up stream | closeout/final-audit | TK-804 | completed |

## 4. 依赖产物策略

1. 本项目是 docs-only governance stream，不修改 `apps/**`、`packages/**`、`bin/**` 或 `test/**` 可执行代码。
2. review remediation 只解决当前 review artifact 已明确暴露的阻断项：secure-capture transition / pre-commit suffix interception，以及 formal scope/module ownership 收口。
3. promotion 只 formalize Phase A：显式 `/secret set <keyName>` secure local capture、redacted local mutation handoff 与相关 contract 边界。
4. `session.main` secure-input outcome、desktop secure dialog 与 VS Code secure prompt 不属于本轮 active truth，必须明确拆到后续 solution。

## 5. DoD（project-091）

1. clean approved review artifact 已生成，并明确上一轮 blocking finding 已全部 resolved。
2. lifecycle registry、delivery registry、module registry 与 normative loading manifest 已同步到 promotion 后真值。
3. `runtime.cli-interactive-shell` 与 `runtime.governance-clients` formal docs 已写入 secure local capture / redacted handoff 的正式边界。
4. `project-092` 已作为真实 planned rollout stream 落地，并在 `current-context.md` 中登记为 planned follow-up。
5. project/sprint/tasks/review/current-context/completed history/artifact registry 已同步通过治理校验。

## 6. 里程碑记录

1. 2026-04-12：用户要求“修复并重新 review，循环直到没有任何问题，然后提升这个技术方案”。
2. 2026-04-12：创建 `project-091 / sprint-001`，承接 secure secret input draft remediation、approval、promotion 与 follow-up decomposition。
3. 2026-04-12：`TK-803` 已完成，draft 已收敛为 Phase-A-only，approved review artifact 已确认无 blocking finding，lifecycle 已推进到 `approved`。
4. 2026-04-12：`TK-804` 已完成 formal cutover；当前 active solution 的 formal landing 固定为 `runtime.cli-interactive-shell` + `runtime.governance-clients`。
5. 2026-04-12：`TK-805` 已完成 docs-only closeout，`project-091` 已恢复为最终 `completed`，并将 `project-092 / sprint-001` 保留为 planned follow-up stream。

## 7. 里程碑记录入口

1. [project-091-session-shell-secure-secret-input-promotion-and-decomposition-completion-audit-summary.md](./project-091-session-shell-secure-secret-input-promotion-and-decomposition-completion-audit-summary.md)
