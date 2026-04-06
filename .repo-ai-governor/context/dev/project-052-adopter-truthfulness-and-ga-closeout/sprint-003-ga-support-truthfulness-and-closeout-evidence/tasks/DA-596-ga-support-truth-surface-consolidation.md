# DA-596 ga support truth surface consolidation

- Status: active
- Date: 2026-04-06
- Owner: AI-Agent
- Artifact ID: `DA-596`
- Produced By: `TK-596`
- Scope: `project-052-adopter-truthfulness-and-ga-closeout`

## 1. Summary

1. `docs/support-matrix*.md` 已升级为 `project-052` 当前窗口唯一的公开 GA support truth surface，并新增统一的 GA support truthfulness snapshot。
2. `docs/maintainer-validation-playbook*.md` 已改成 maintainer runbook 与 backlink router，不再独立维护正式 support status。
3. `docs/ga-readiness-evidence*.md` 已明确保留 program-level signal matrix 角色，并回链到由 `project-052 / sprint-003` 刷新的 support truth surface。

## 2. Consolidated Truth Surface

1. Canonical public claim:
   - `docs/support-matrix.md`
   - `docs/support-matrix.zh-CN.md`
2. Maintainer runbook and backlinks:
   - `docs/maintainer-validation-playbook.md`
   - `docs/maintainer-validation-playbook.zh-CN.md`
3. Program-level GA signal matrix:
   - `docs/ga-readiness-evidence.md`
   - `docs/ga-readiness-evidence.zh-CN.md`

## 3. Evidence Backlinks Now Carried By The Unified Surface

1. `.tmp/project-052-sprint-001-cleanroom-report.json`
2. `.tmp/project-052-sprint-001-local-distribution-report.json`
3. `.tmp/project-052-sprint-002-command-rehearsal-summary.json`
4. `pnpm run release:verify-local`
5. `docs/ga-readiness-evidence.md` / `docs/ga-readiness-evidence.zh-CN.md`

## 4. Guardrails Preserved

1. `README*` 与 `docs/local-adoption-playbook*.md` 继续保持最小 adopter 入口和操作路径说明，不承接新的 closeout truth table。
2. maintainer playbook 只负责命令顺序、验证意图和 backlinks，不再平行复制 support matrix。
3. `project-final` 完成态结论与 next-stream recommendation 仍由 `TK-597` 统一收口。

## 5. Validation

1. `rg -n "GA Support Truthfulness Snapshot|Formal Support Truth Route|program-level signal matrix|project-052 / sprint-003" docs/support-matrix.md docs/support-matrix.zh-CN.md docs/maintainer-validation-playbook.md docs/maintainer-validation-playbook.zh-CN.md docs/ga-readiness-evidence.md docs/ga-readiness-evidence.zh-CN.md`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-code-review-status-sync.js`
5. `node ./scripts/governance/check-worktree-review-target.js`
6. `pnpm run check`

## 6. Next Boundary

1. `TK-597` 基于同一 truth surface 产出 `project-052` completion audit summary。
2. `TK-597` 把 project closeout verdict、milestone backlink 与 next-stream recommendation 收口为最终 handoff。
