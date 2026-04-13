# TK-802 activate project-091 and freeze session-shell secure secret input scope

- Status: completed
- Date: 2026-04-12
- Owner: AI-Agent
- Priority: P0
- Project: `project-091-session-shell-secure-secret-input-promotion-and-decomposition`
- Sprint: `sprint-001-review-promotion-and-followup-decomposition`

## 1. 任务目标

建立 `project-091` 的 canonical governance surface，并冻结本轮 review/promotion 只承接 Phase A secure secret input 的边界。

## 2. Depends On

1. `.repo-ai-governor/draft/session-shell-secure-secret-input-and-redacted-command-handoff-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-090-session-shell-secure-secret-input-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_session-shell-secure-secret-input-and-redacted-command-handoff.md`

## 3. 预期产物

1. `project-091` project / sprint plan
2. 冻结后的任务包 `TK-802 ~ TK-805`
3. 已明确的 `project-092` planned rollout 边界

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
3. `.repo-ai-governor/context/dev/project-090-session-shell-secure-secret-input-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_session-shell-secure-secret-input-and-redacted-command-handoff.md`

## 5. Traceback References

1. `.codex/skills/technical-solution-review/SKILL.md`
2. `.codex/skills/technical-solution-promotion/SKILL.md`

## 6. 实施计划

1. 冻结 Phase A-only review/promotion scope。
2. 将本轮 promotion 的 formal landing 固定为 `runtime.cli-interactive-shell + runtime.governance-clients`。
3. 预留 `project-092` 作为实现 follow-up stream，而不在当前 sprint 冒然实现代码。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-12：任务创建并在同一窗口完成，固定本轮 governance scope 为“Phase A secure secret input review + promotion + planned rollout decomposition”。
2. 2026-04-12：已明确本轮不得把 `entry.cli` 或 `session.main` secure-input outcome 写成 formal producer truth。

## 10. 产出

1. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-091-session-shell-secure-secret-input-promotion-and-decomposition/plan.md`
2. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-091-session-shell-secure-secret-input-promotion-and-decomposition/sprint-001-review-promotion-and-followup-decomposition/plan.md`
