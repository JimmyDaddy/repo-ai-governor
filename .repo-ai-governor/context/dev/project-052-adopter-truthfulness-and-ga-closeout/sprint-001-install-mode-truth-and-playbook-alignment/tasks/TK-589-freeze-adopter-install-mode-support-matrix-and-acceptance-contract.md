# TK-589 freeze adopter install mode support matrix and acceptance contract

- Status: completed
- Date: 2026-04-06
- Task ID: `TK-589`
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-052-adopter-truthfulness-and-ga-closeout`
- Sprint: `sprint-001-install-mode-truth-and-playbook-alignment`

## 1. 任务目标

冻结 adopter install mode support matrix、acceptance contract 与正式支持边界。

## 2. Depends On

1. `DA-588`

## 3. 预期产物

1. install mode support contract 文档
2. 更新后的 `docs/support-matrix.*`
3. sprint-001 install truth baseline 记录

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `README.md`
3. `docs/local-adoption-playbook.md`
4. `docs/support-matrix.md`
5. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-051-priority-roadmap-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-588-priority-roadmap-promotion-and-rollout-decomposition-handoff.md`
2. `.repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux/plan.md`
3. `.repo-ai-governor/context/dev/project-026-prd-gap-remediation/plan.md`
4. `.repo-ai-governor/context/dev/project-046-p1-product-surface-and-delivery-closure/plan.md`

## 6. 实施计划

1. 冻结 `path / link / dist-binary / tgz` 的当前正式支持口径与首选场景。
2. 用 install-mode acceptance contract 文档回链 README、playbook 与 support matrix 的外部叙事。
3. 为 `TK-590` 和 `TK-591` 提供不再含糊的 support boundary truth。

## 7. Development Verification

1. `rg -n "path|link|tgz|dist" README.md docs/local-adoption-playbook.md docs/support-matrix.md`
2. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --task-id TK-589`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-06：任务创建，等待 `project-052` 激活。
2. 2026-04-06：状态切换为 `in_progress`，开始冻结 install mode support matrix、acceptance contract 与正式支持边界。
3. 2026-04-06：已完成 install mode acceptance contract 冻结，support matrix / README / playbook 已统一声明 `path`、`link`、`dist-binary`、`tgz` 的正式支持边界，并产出 `DA-589`。

## 10. 产出

1. `DA-589-install-mode-support-matrix-and-acceptance-contract.md`
2. `docs/support-matrix.md`
3. `docs/support-matrix.zh-CN.md`
