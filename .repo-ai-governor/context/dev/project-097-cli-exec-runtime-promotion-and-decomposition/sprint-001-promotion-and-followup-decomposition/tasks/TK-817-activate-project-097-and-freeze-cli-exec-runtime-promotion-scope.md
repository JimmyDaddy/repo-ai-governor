# TK-817 activate project-097 and freeze cli-exec runtime promotion scope

- Status: completed
- Date: 2026-04-13
- Owner: AI-Agent
- Priority: P0
- Project: `project-097-cli-exec-runtime-promotion-and-decomposition`
- Sprint: `sprint-001-promotion-and-followup-decomposition`

## 1. 任务目标

创建 promotion / decomposition 执行面，并冻结本轮只 formalize `runtime.agent-projection` producer truth、lifecycle / delivery synchronization 与 planned rollout handoff。

## 2. Depends On

1. `.repo-ai-governor/context/dev/project-096-cli-exec-runtime-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_cli-exec-runtime-hardening-and-explicit-acp-extension-seam.md`
2. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`

## 3. 预期产物

1. `project-097` project / sprint skeleton
2. frozen promotion scope statement
3. promotion-only governance boundary

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.codex/skills/technical-solution-promotion/SKILL.md`
3. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
4. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-096-cli-exec-runtime-solution-review/project-096-cli-exec-runtime-solution-review-completion-audit-summary.md`

## 6. 实施计划

1. 激活 `project-097 / sprint-001`，作为本轮 promotion / decomposition 的唯一 execution surface。
2. 明确 formal landing 固定为既有 `runtime.agent-projection` module，而不是新建平行 runtime module。
3. 明确本轮不宣称 shared runtime、adapter cutover、Windows/Unix hardening 或 ACP public support 已交付。

## 7. Development Verification

1. project / sprint surface cross-check

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-13：任务创建，状态初始化为 `completed`。
2. 2026-04-13：已创建 `project-097 / sprint-001` skeleton，并将其冻结为当前 cli-exec runtime promotion / decomposition surface。
3. 2026-04-13：已冻结本轮 scope，只 formalize module docs、registries 与 planned rollout handoff。
