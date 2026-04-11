# TK-784 activate project-088 and freeze local-user-config promotion scope

- Status: completed
- Date: 2026-04-11
- Owner: AI-Agent
- Priority: P0
- Project: `project-088-local-user-config-and-secret-command-promotion-and-decomposition`
- Sprint: `sprint-001-promotion-and-followup-decomposition`

## 1. 任务目标

创建 promotion / decomposition 执行面，并冻结本轮只 formalize producer/consumer module truth、lifecycle / delivery synchronization 与 planned rollout handoff。

## 2. Depends On

1. `.repo-ai-governor/context/dev/project-087-local-user-config-and-secret-command-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_local-user-config-and-secret-backed-command-configuration.md`
2. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`

## 3. 预期产物

1. `project-088` project / sprint skeleton
2. `current-context.md` active stream registration
3. frozen promotion scope statement

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.codex/skills/technical-solution-promotion/SKILL.md`
3. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
4. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-087-local-user-config-and-secret-command-solution-review/project-087-local-user-config-and-secret-command-solution-review-completion-audit-summary.md`

## 6. 实施计划

1. 激活 `project-088 / sprint-001`，作为本轮 promotion / decomposition 的唯一 execution surface。
2. 明确 formal landing 固定为 `runtime.agent-projection + runtime.governance-clients`，不新建平行 module。
3. 明确本轮不宣称 CLI 命令、secret backend 或 public docs wording 已交付。

## 7. Development Verification

1. project / sprint / current-context surface cross-check

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-11：任务创建，状态初始化为 `completed`。
2. 2026-04-11：已创建 `project-088 / sprint-001` skeleton，并将其登记为当前 promotion / decomposition surface。
3. 2026-04-11：已冻结本轮 scope，只 formalize module docs、registries 与 planned rollout handoff。

## 10. 产出

1. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-088-local-user-config-and-secret-command-promotion-and-decomposition/plan.md`
2. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/current-context.md`
