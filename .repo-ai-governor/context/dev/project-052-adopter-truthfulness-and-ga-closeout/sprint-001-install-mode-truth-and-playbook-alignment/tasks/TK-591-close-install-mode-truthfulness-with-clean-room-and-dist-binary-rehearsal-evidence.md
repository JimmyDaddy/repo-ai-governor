# TK-591 close install-mode truthfulness with clean-room and dist-binary rehearsal evidence

- Status: completed
- Date: 2026-04-06
- Task ID: `TK-591`
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-052-adopter-truthfulness-and-ga-closeout`
- Sprint: `sprint-001-install-mode-truth-and-playbook-alignment`

## 1. 任务目标

以 clean-room 与 dist-binary rehearsal evidence 收口 install-mode truthfulness。

## 2. Depends On

1. `TK-589`
2. `TK-590`

## 3. 预期产物

1. clean-room verification evidence
2. dist-binary / local distribution verification evidence
3. sprint-001 acceptance summary

## 4. Required Inputs

1. `docs/support-matrix.md`
2. `docs/ga-readiness-evidence.md`
3. `package.json`
4. `scripts/release/verify-cleanroom-local-install.js`
5. `scripts/release/verify-local-distribution.js`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-026-prd-gap-remediation/sprint-004-ga-evidence-and-support-matrix/plan.md`
2. `.repo-ai-governor/context/dev/project-046-p1-product-surface-and-delivery-closure/plan.md`
3. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/plan.md`

## 6. 实施计划

1. 基于 `TK-589` / `TK-590` 冻结后的支持边界重跑 clean-room 和 dist-binary 证据。
2. 把最新证据写回 support matrix、sprint acceptance 与后续 sprint 输入面。
3. 为 sprint-001 scoped CR loop 提供可复查的验证基线。

## 7. Development Verification

1. `node ./scripts/release/verify-cleanroom-local-install.js --modes path,link --iterations 1 --output .tmp/project-052-sprint-001-cleanroom-report.json`
2. `node ./scripts/release/verify-local-distribution.js`

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --task-id TK-591`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-06：任务创建，等待 `TK-589 / TK-590` 完成。
2. 2026-04-06：状态切换为 `in_progress`，开始刷新 clean-room install 与 dist-binary / local distribution rehearsal evidence。
3. 2026-04-06：`verify-cleanroom-local-install` 与 `verify-local-distribution` 均通过，support matrix 已写回最新 install-mode evidence，并产出 `DA-591`。

## 10. 产出

1. `DA-591-cleanroom-and-dist-binary-install-mode-evidence-refresh.md`
2. `.tmp/project-052-sprint-001-cleanroom-report.json`
3. `.tmp/project-052-sprint-001-local-distribution-report.json`
4. `docs/support-matrix.md`
5. `docs/support-matrix.zh-CN.md`
