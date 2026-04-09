# project-061 adoption-pack installer and self-host bootstrap rollout completion audit summary

- Status: completed
- Date: 2026-04-09
- Audit Scope: `project-061-adoption-pack-installer-and-self-host-bootstrap-rollout`
- Completion Conclusion: `completed`

## 1. Completion Conclusion

1. `project-061` 当前 completion conclusion 为 `completed`。
2. `CR-001` 已完成 project-final delegated review、accepted finding 修复、governance write-back 与 final recheck，当前评审状态为 `resolved`。
3. `project-061` 已把 adoption-pack installer、managed metadata lifecycle、self-host template bootstrap 与 clean-room truthfulness 证据收敛到同一条可回放的正式证据链。

## 2. Closeout Outcome

1. `adopt list/apply/diff/verify/upgrade/remove` 已作为 adopter baseline 的首选整仓安装路径稳定落地，并保持对 drift / provenance / managed ownership 的受控表达。
2. `self-host-complete` 已作为显式 `repo_local` template-bootstrap 路径落地，补齐 task-ledger sqlite、artifact-registry sqlite 与治理 authoring templates 初始化面。
3. `project-061` 的 project / sprint / review / context history 已完成同窗口 closeout write-back；当前没有新的 active primary stream。

## 3. Audit Scope

1. `sprint-001-manifest-resolver-and-installer-contract`
2. `sprint-002-adopt-apply-and-managed-metadata`
3. `sprint-003-complete-pack-content-and-host-materialization`
4. `sprint-004-diff-upgrade-remove-and-adoption-verify`
5. `sprint-005-self-host-template-bootstrap-and-governance-authoring-surfaces`
6. `sprint-006-clean-room-rehearsals-and-docs-truthfulness`

## 4. Task Completion Statistics

1. Total `TK` tasks currently materialized in project scope: `19`
2. Latest `TK` status `completed` count: `19 / 19`
3. Latest `CR` status `resolved` count: `1 / 1`
4. Remaining implementation or review gaps before project completion claim: `0`

## 5. Key Evidence

1. `./plan.md`
2. `./sprint-001-manifest-resolver-and-installer-contract/plan.md`
3. `./sprint-002-adopt-apply-and-managed-metadata/plan.md`
4. `./sprint-003-complete-pack-content-and-host-materialization/plan.md`
5. `./sprint-004-diff-upgrade-remove-and-adoption-verify/plan.md`
6. `./sprint-005-self-host-template-bootstrap-and-governance-authoring-surfaces/plan.md`
7. `./sprint-006-clean-room-rehearsals-and-docs-truthfulness/plan.md`
8. `./sprint-006-clean-room-rehearsals-and-docs-truthfulness/review/resolved_code_review_working-tree-20260409-0305.md`
9. `./sprint-006-clean-room-rehearsals-and-docs-truthfulness/tasks/TK-673-sprint-006-exit-acceptance-and-project-final-closeout-readiness.md`
10. `./sprint-006-clean-room-rehearsals-and-docs-truthfulness/tasks/TK-674-finalize-project-061-closeout-and-completion-audit.md`
11. `./sprint-006-clean-room-rehearsals-and-docs-truthfulness/tasks/CR-001.md`
12. `./sprint-006-clean-room-rehearsals-and-docs-truthfulness/tasks/checklist.md`
13. `./sprint-006-clean-room-rehearsals-and-docs-truthfulness/tasks/tasks.csv`
14. `../../../../README.md`
15. `../../../../README.zh-CN.md`
16. `../../../../docs/local-adoption-playbook.md`
17. `../../../../docs/local-adoption-playbook.zh-CN.md`
18. `../../../../docs/support-matrix.md`
19. `../../../../docs/support-matrix.zh-CN.md`
20. `../../../../.tmp/project-061-adoption-pack-cleanroom-summary.json`
21. `../../../../.repo-ai-governor/context/current-context.md`
22. `../../../../.repo-ai-governor/context/completed-streams-history.md`

## 6. Delivered Capability Summary

1. Built-in `adopt apply` 现已可以在不要求预先存在 source-local `.codex/skills/**` 的前提下，安装 managed multi-host adopter baseline。
2. install receipt 现已稳定保留 `hostTargets` 多 host truth，并兼容旧版只含 `hostTarget` 的 receipt。
3. `adopt remove` 现已恢复 drift fail-closed 语义：用户修改的受管文件不会在 drift state 下被 `--force` 直接删除。
4. `self-host-complete` 现已把 repo-local bootstrap、sqlite registries、project/sprint template 与技术方案 authoring surfaces 一次性初始化到目标仓库。

## 7. Verification Evidence

1. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts packages/standards/test/adoption-pack-registry.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
6. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 8. Next-stream Recommendation

1. 当前没有新的 active primary stream；下一条执行流应在新用户需求明确后再创建并激活。
2. 若后续继续扩展 installer contract、managed metadata layout 或 self-host semantics，应先刷新 clean-room evidence，再更新 README / playbook / support matrix 口径。

## 9. Residual Risk And Follow-Up Advice

1. multi-host install 仍把 receipt/backlink 链聚焦在 primary host apply report；若未来要把每个 host 的 apply report 都提升为一等审计入口，应在新窗口单独推进 contract 变更和 evidence refresh。
2. 当前 closeout 依赖 `.tmp/project-061-adoption-pack-cleanroom-summary.json` 这份本地证据包；若后续需要 release-grade 归档，应补充正式的长期保留路径。
