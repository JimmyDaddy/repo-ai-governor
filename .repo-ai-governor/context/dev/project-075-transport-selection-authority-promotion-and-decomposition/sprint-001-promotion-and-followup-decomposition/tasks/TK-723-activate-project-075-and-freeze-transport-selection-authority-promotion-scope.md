# TK-723 activate project-075 and freeze transport-selection-authority promotion scope

- Status: completed
- Date: 2026-04-09
- Owner: AI-Agent
- Priority: P0
- Project: `project-075-transport-selection-authority-promotion-and-decomposition`
- Sprint: `sprint-001-promotion-and-followup-decomposition`

## 1. 任务目标

建立 promotion / decomposition stream，并冻结 solution id、target module、delivery mode 与 evidence-gated docs boundary。

## 2. Depends On

1. `.repo-ai-governor/context/dev/project-074-transport-selection-authority-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_transport-selection-authority-and-strict-routing-followup.md`
2. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
3. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 3. 预期产物

1. `project-075` project / sprint plan
2. promotion scope freeze note
3. canonical task ledger initialization

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-074-transport-selection-authority-solution-review/project-074-transport-selection-authority-solution-review-completion-audit-summary.md`
3. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
4. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 5. Traceback References

1. `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-074-transport-selection-authority-solution-review/plan.md`

## 6. 实施计划

1. 创建 `project-075 / sprint-001` promotion stream 骨架。
2. 冻结 target module=`runtime.agent-projection`、delivery mode=`followup_required` 与 docs boundary。
3. 初始化 task cards 与派生台账。

## 7. Development Verification

1. `node ./scripts/governance/sync-task-ledger.js --tasks-dir .repo-ai-governor/context/dev/project-075-transport-selection-authority-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks --task-id TK-723 --execution-id exec-20260409-723 --result "已完成 project-075 目录骨架与 promotion scope 冻结" --verify "task-ledger 已初始化" --review-delta "待同轮 promotion review 汇总" --checklist-note "2026-04-09：完成 project-075 目录骨架、promotion scope、target module 与 delivery mode 冻结。"`
2. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-sprint-plan-status-sync.js`
2. `node ./scripts/governance/check-code-review-status-sync.js`

## 9. 执行记录

1. 2026-04-09：任务创建，状态初始化为 `planned`。
2. 2026-04-09：完成 `project-075 / sprint-001` 目录骨架、promotion scope、target module 与 delivery mode 冻结。
3. 2026-04-09：确认本轮不提升 `docs/support-matrix*` 与 `docs/local-adoption-playbook*` 的 public support wording。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-075-transport-selection-authority-promotion-and-decomposition/plan.md`
2. `.repo-ai-governor/context/dev/project-075-transport-selection-authority-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/plan.md`
