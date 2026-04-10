# TK-736 sprint-002 exit acceptance and sprint-003 activation handoff

- Status: completed
- Date: 2026-04-10
- Owner: AI-Agent
- Priority: P0
- Project: `project-076-transport-selection-authority-rollout`
- Sprint: `sprint-002-connect-selection-ux-and-candidate-materialization`

## 1. 任务目标

完成 `sprint-002` 的 closeout、治理写回与下一条执行面切换，让 `sprint-003` 可以在不丢失 transport-selection truth 与 CR evidence 的前提下正式激活。

## 2. Depends On

1. `TK-729`
2. `TK-730`
3. `TK-731`
4. `CR-001`
5. `CR-002`
6. `CR-003`

## 3. 预期产物

1. `DA-736-sprint-002-closeout-and-sprint-003-activation-handoff.md`
2. 更新后的 `.repo-ai-governor/context/current-context.md` 与 `.repo-ai-governor/context/completed-streams-history.md`
3. 更新后的 `project-076` / `sprint-002` / `sprint-003` plan 与同步后的 sprint ledger
4. `TK-732` 激活记录

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/completed-streams-history.md`
3. `.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/plan.md`
4. `.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/sprint-002-connect-selection-ux-and-candidate-materialization/plan.md`
5. `.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/sprint-003-evidence-gated-docs-and-adopter-truth/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
2. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
3. `.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/sprint-002-connect-selection-ux-and-candidate-materialization/review/resolved_code_review_working-tree-20260410-0109.md`
4. `.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/sprint-002-connect-selection-ux-and-candidate-materialization/review/resolved_code_review_working-tree-20260410-0138.md`

## 6. 实施计划

1. 收口 `sprint-002` 的 review lifecycle、candidate/apply truth 与 closeout truth。
2. 更新 project / sprint 计划、current-context 与 completed stream history。
3. 激活 `sprint-003` 与 `TK-732`，确保下一条 evidence-gated 执行边界可以持续推进。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/check-worktree-review-target.js`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run check`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
5. `node ./scripts/governance/check-code-review-status-sync.js`
6. `node ./scripts/governance/check-worktree-review-target.js`

## 9. 执行记录

1. 2026-04-10：任务创建并直接执行 sprint-002 closeout、context/history 写回与 sprint-003 activation handoff。
2. 2026-04-10：已完成 `DA-736`、project/sprint/context/history 写回，并激活 `sprint-003` 与 `TK-732`。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/sprint-002-connect-selection-ux-and-candidate-materialization/tasks/DA-736-sprint-002-closeout-and-sprint-003-activation-handoff.md`
2. `.repo-ai-governor/context/current-context.md`
3. `.repo-ai-governor/context/completed-streams-history.md`
4. `.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/plan.md`
5. `.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/sprint-002-connect-selection-ux-and-candidate-materialization/plan.md`
6. `.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/sprint-003-evidence-gated-docs-and-adopter-truth/plan.md`
7. `.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/sprint-003-evidence-gated-docs-and-adopter-truth/tasks/TK-732-produce-clean-room-and-verify-evidence-for-codex-and-claude-code-remote-api-paths.md`
