# TK-747 activate project-078 and freeze normative-loading promotion scope

- Status: completed
- Date: 2026-04-11
- Owner: AI-Agent
- Priority: P0
- Project: `project-078-normative-loading-promotion-and-decomposition`
- Sprint: `sprint-001-promotion-and-followup-decomposition`

## 1. 任务目标

建立 `project-078 / sprint-001` 的 canonical governance surface，并冻结本轮 promotion / decomposition 的 solution id、formal landing、delivery mode 与 stream ownership。

## 2. Depends On

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
3. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 3. 预期产物

1. `project-078` project / sprint plan
2. `project-078 / sprint-001` task cards 与 review surface
3. `current-context.md` primary stream 激活与 `project-077` completed-history 迁移

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/draft/normative-loading-manifest-lifecycle-compaction-and-staged-sharding-technical-solution.md`
3. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-005-regression-migration-cleanup-and-project-closeout/review/approved_solution_review_normative-loading-manifest-lifecycle-compaction-and-staged-sharding.md`
4. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
5. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-075-transport-selection-authority-promotion-and-decomposition/plan.md`
2. `.repo-ai-governor/context/dev/project-060-adoption-pack-promotion-and-decomposition/plan.md`

## 6. 实施计划

1. 创建 `project-078 / sprint-001` 目录骨架与初始计划文档。
2. 冻结本轮只做 promotion / decomposition，不提前实现 archive split、compact script 或 active sharding follow-up。
3. 将 `project-078 / sprint-001` 登记为新的 primary stream，并把 `project-077 / sprint-005` 迁入 completed history。

## 7. Development Verification

1. `node ./scripts/governance/sync-task-ledger.js --tasks-dir .repo-ai-governor/context/dev/project-078-normative-loading-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks --task-id TK-747 --execution-id exec-20260411-747-bootstrap --result "已完成 project-078 目录骨架、初始 plan/tasks surface 与 current-context primary 切换" --verify "task-ledger initialized" --review-delta "project-077 moved into completed history; ready for promotion cutover" --checklist-note "2026-04-11：已创建 project-078 / sprint-001 目录骨架，并将该 sprint 切换为新的 primary closeout surface。"`
2. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-sprint-plan-status-sync.js`
2. `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`

## 9. 执行记录

1. 2026-04-11：任务创建，状态初始化为 `completed`。
2. 2026-04-11：已创建 `project-078 / sprint-001` 目录骨架、初始 project/sprint plan、治理任务卡与 review 目录。
3. 2026-04-11：已将 `project-078 / sprint-001` 登记为 `current-context.md` 的 primary stream，并将 `project-077 / sprint-005` 迁入 completed history。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-078-normative-loading-promotion-and-decomposition/plan.md`
2. `.repo-ai-governor/context/dev/project-078-normative-loading-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/plan.md`
3. `.repo-ai-governor/context/current-context.md`
