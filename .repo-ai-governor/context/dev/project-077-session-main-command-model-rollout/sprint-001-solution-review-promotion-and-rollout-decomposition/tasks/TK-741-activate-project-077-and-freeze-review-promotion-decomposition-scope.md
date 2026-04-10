# TK-741 activate project-077 and freeze review-promotion-decomposition scope

- Status: completed
- Date: 2026-04-10
- Owner: AI-Agent
- Priority: P0
- Project: `project-077-session-main-command-model-rollout`
- Sprint: `sprint-001-solution-review-promotion-and-rollout-decomposition`

## 1. 任务目标

建立 `project-077 / sprint-001` 的 canonical governance surface，并冻结 review / promotion / decomposition 的目标 solution、formal landing 与 stream ownership。

## 2. Depends On

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
3. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 3. 预期产物

1. `project-077` project / sprint plan
2. `project-077 / sprint-001` task cards 与 review surface
3. `current-context.md` 并行 active stream 登记

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/draft/session-main-prompt-first-command-mental-model-and-deterministic-workflow-split-technical-solution.md`
3. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
4. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-075-transport-selection-authority-promotion-and-decomposition/plan.md`

## 6. 实施计划

1. 创建 `project-077 / sprint-001` 目录骨架与初始计划文档。
2. 冻结本轮只做 review / promotion / decomposition，不触碰 `project-076` 的未收口 CR。
3. 初始化 canonical task ledger，并把 `project-077 / sprint-001` 登记为并行 active stream。

## 7. Development Verification

1. `node ./scripts/governance/sync-task-ledger.js --tasks-dir .repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-001-solution-review-promotion-and-rollout-decomposition/tasks --task-id TK-741 --execution-id exec-20260410-741-bootstrap --result "已完成 project-077 目录骨架、初始 plan/tasks surface 与并行 active stream 登记" --verify "task-ledger initialized" --review-delta "ready for technical-solution review loop" --checklist-note "2026-04-10：已创建 project-077 / sprint-001 目录骨架，并把该 sprint 登记为与 project-076 并行的 active stream。"`
2. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-sprint-plan-status-sync.js`
2. `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`

## 9. 执行记录

1. 2026-04-10：任务创建，状态初始化为 `in_progress`。
2. 2026-04-10：已创建 `project-077 / sprint-001` 目录骨架、初始 project/sprint plan、治理任务卡与 review 目录。
3. 2026-04-10：已将 `project-077 / sprint-001` 登记到 `current-context.md` 的并行 active streams，并明确不改写 `project-076` 的 primary / CR surface。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-001-solution-review-promotion-and-rollout-decomposition/plan.md`
3. `.repo-ai-governor/context/current-context.md`
