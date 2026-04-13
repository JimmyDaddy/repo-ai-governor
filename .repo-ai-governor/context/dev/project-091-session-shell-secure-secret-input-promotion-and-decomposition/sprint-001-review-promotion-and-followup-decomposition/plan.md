# sprint-001-review-promotion-and-followup-decomposition 计划

- Status: completed
- Date: 2026-04-12
- Project: `project-091-session-shell-secure-secret-input-promotion-and-decomposition`
- Sprint Goal: 完成 secure secret input solution 的 draft remediation、clean review、formal promotion 与 planned rollout decomposition。
- Upstream:
  - `.repo-ai-governor/draft/session-shell-secure-secret-input-and-redacted-command-handoff-technical-solution.md`
  - `.repo-ai-governor/context/dev/project-090-session-shell-secure-secret-input-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_session-shell-secure-secret-input-and-redacted-command-handoff.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`

## 1. Scope

1. 按 project-090 的 canonical review finding 修订 draft，并确保 secure-capture transition 与 Phase-A-only scope 已经可 promotion。
2. 新建 clean approved review artifact，明确上一轮 blocker disposition，并把 lifecycle 推进到 `approved`。
3. 通过 `technical-solution-promotion` 完成 formal cutover，并把实现 follow-up 落到 planned `project-092 / sprint-001`。

## 2. Task Package

1. `TK-802` activate project-091 and freeze session-shell secure secret input scope
2. `TK-803` remediate draft and approve session-shell secure secret input solution
3. `TK-804` promote secure secret input solution and decompose planned rollout into project-092
4. `TK-805` finalize project-091 closeout and register the new planned follow-up stream

## 3. Exit Criteria

1. approved review artifact 已明确两条 prior blocking finding 都已 resolved。
2. formal docs、lifecycle / delivery / module / manifest 已同步更新，solution 进入 `active`。
3. `project-092 / sprint-001` 已落盘为 planned follow-up stream，且 `current-context.md` 已回写。
4. docs-only promotion / closeout review、task ledger、artifact registry 与 completed history gate 全部通过。

## 4. Sprint Notes

1. 本 sprint 是 docs-only governance 窗口，不跑 `pnpm run build`。
2. 当前 solution 的 active formal scope 只包含 explicit `/secret set <keyName>` secure local capture；service-owned secure-input request 和 desktop / VS Code parity 必须留在 follow-up。
3. promotion 期间不得把 `entry.cli` 继续写成 target module truth，也不得在 formal docs 里引入新的 service-owned secure-input outcome。
