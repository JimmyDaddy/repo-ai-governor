# DA-710 sprint-001 closeout and sprint-002 activation handoff

- Status: completed
- Date: 2026-04-08
- Project: `project-068-p2-fallback-and-reserved-target-followups`
- Sprint: `sprint-001-local-model-capability-ceiling-and-promoted-use-case`
- Task: `TK-710`

## 1. 出口结论

`accept`

`project-068 / sprint-001-local-model-capability-ceiling-and-promoted-use-case` 已满足当前 sprint 的退出条件。`local-model` 的 capability ceiling、promoted use case 与 explicit non-goal guardrails 已通过 docs/support-truth 收口，并经 fresh delegated CR loop 修复 2 个可执行问题后 clean `resolved`，可以作为 `sprint-002` reserved-target contract freeze 的正式输入。

本次 closeout 写回窗口只涉及 README、support-truth 文档、review artifact、治理台账、plan/context/history 与下一 sprint 激活，不新增新的 executable surface 变更；因此 build not required。本窗口所需治理同步检查与最终 delivery gate 已全部通过。

## 2. 验收范围

1. `local-model` support-truth：
   - promoted use case 已固定为 restricted-network / operator-selected local fallback only。
   - `tool_calling`、`structured_output`、`confirmation_gate` 维持 unsupported，`parallel_task` / `streaming` / `cancellation` 维持 degraded。
2. review closure：
   - `CR-001` 已修复 README 过宽措辞与错误的 aggregate verification entry，并收口为 `resolved`。
3. closeout 与切换：
   - `project-068 / sprint-001` 已写回 completed 真值。
   - `current-context.md` 已切到 `sprint-002`。
   - `stream-project-068-sprint-001` 已迁入 `.repo-ai-governor/context/completed-streams-history.md`。
   - `TK-684` 已激活为下一条 primary task。

## 3. 出口判定

1. Exit Criteria 1：通过
   - `local-model` capability ceiling 已冻结，不再保留“默认 primary lane”式含混口径。
2. Exit Criteria 2：通过
   - promoted use case 与 explicit non-goal guardrails 已同步到 README、support matrix、adoption playbook 与 maintainer validation playbook。
3. Review Closure：通过
   - `CR-001` 已 `resolved`，最新 round 未留下新的 actionable finding。

## 4. sprint-002 激活约束

1. `sprint-002` 只收口 `github-com-agent` 的 reserved-target contract、blocked-mode exit criteria 与 backlog handoff，不扩张新的主线产品化实现。
2. `TK-684` 先冻结 target contract 与 unlock criteria，再进入 `TK-685` 的 reserved-boundary reinforcement。
3. 若后续发现 reserved-target follow-up 与 `sprint-001` 的 fallback-only boundary 冲突，应先回写 contract truth，再继续实现，不直接跳过到 `TK-685` / `TK-686`。

## 5. 关键产物

1. `.repo-ai-governor/context/dev/project-068-p2-fallback-and-reserved-target-followups/sprint-001-local-model-capability-ceiling-and-promoted-use-case/review/resolved_code_review_working-tree-20260408-1202.md`
2. `.repo-ai-governor/context/current-context.md`
3. `.repo-ai-governor/context/completed-streams-history.md`
4. `.repo-ai-governor/context/dev/project-068-p2-fallback-and-reserved-target-followups/sprint-002-github-com-agent-target-followup/tasks/TK-684-freeze-github-com-agent-target-contract-and-blocked-mode-exit-criteria.md`

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/check-worktree-review-target.js`
5. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
6. `pnpm run check`
