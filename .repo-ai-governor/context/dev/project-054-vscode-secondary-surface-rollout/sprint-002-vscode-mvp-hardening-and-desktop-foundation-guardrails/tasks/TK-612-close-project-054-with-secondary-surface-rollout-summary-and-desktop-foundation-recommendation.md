# TK-612 close project-054 with secondary surface rollout summary and desktop foundation recommendation

- Status: planned
- Date: 2026-04-06
- Task ID: `TK-612`
- Owner: `AI-Agent`
- Priority: `P1`
- Sprint: `sprint-002-vscode-mvp-hardening-and-desktop-foundation-guardrails`
- Project: `project-054-vscode-secondary-surface-rollout`

## 1. 任务目标

形成 secondary surface rollout summary 与 desktop foundation recommendation。

## 2. Depends On

1. `TK-610`
2. `TK-611`

## 3. Expected Outputs

1. rollout summary
2. desktop foundation recommendation
3. project closeout truth

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/sprint-002-vscode-mvp-hardening-and-desktop-foundation-guardrails/plan.md`
3. `.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/sprint-002-vscode-mvp-hardening-and-desktop-foundation-guardrails/tasks/TK-610-freeze-vs-code-mvp-gap-list-and-desktop-foundation-non-goal-guardrails.md`
4. `.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/sprint-002-vscode-mvp-hardening-and-desktop-foundation-guardrails/tasks/TK-611-implement-targeted-vs-code-mvp-hardening-and-trust-sensitive-diagnostics-follow-through.md`
5. `.repo-ai-governor/context/current-context.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/sprint-001-vscode-support-boundary-and-packaging-narrative/tasks/DA-640-sprint-001-closeout-and-sprint-002-activation-handoff.md`
2. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`

## 6. 实施计划

1. 汇总 VS Code secondary surface rollout 在 `project-054` 范围内的 contract、implementation 与 evidence 结论。
2. 给出 desktop foundation-only recommendation，明确 non-goal 与后续切分边界。
3. 为 project-final scoped CR loop 与 project closeout 准备统一 truth surface。

## 7. Development Verification

1. `pnpm run build`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run check`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
5. `node ./scripts/governance/check-code-review-status-sync.js`
6. `node ./scripts/governance/check-worktree-review-target.js`

## 9. 执行记录

1. 2026-04-06：任务创建，等待 `TK-610 / TK-611` 完成。

## 10. 产出

1. 待执行：secondary surface rollout summary
2. 待执行：desktop foundation recommendation
3. 待执行：project-final-ready truth surface
