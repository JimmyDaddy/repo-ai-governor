# project-064 vscode packaged secondary surface rollout completion audit summary

- Status: completed
- Date: 2026-04-08
- Audit Scope: `project-064-vscode-packaged-secondary-surface-rollout`
- Completion Conclusion: `completed`

## 1. Completion Conclusion

1. `project-064` 当前 completion conclusion 为 `completed`。
2. `CR-002` 已将 project-final delegated CR loop 收口为 clean，最终 closeout write-back 已由 `TK-705 / DA-705` 完成。
3. `project-064` 已把 VS Code packaged secondary surface 的正式支持边界、local VSIX packaging evidence 与 public support-truth narrative 收敛为一条对 adopter truthful 的稳定证据链。

## 2. Closeout Outcome

1. `project-064` 的 project / sprint / review / context history / delivery registry 已完成同窗口 closeout write-back。
2. `sprint-001` 已冻结“已构建源码仓 + extension-development host / locally generated VSIX / packaged extension root”这条正式支持边界，并明确排除了已发布 npm/tgz 安装器与 Marketplace。
3. `release:verify-vscode-extension-distribution`、`verify-local-distribution`、README、local adoption playbook、maintainer validation playbook 与 support matrix 现在共用相同的 packaged secondary-surface truth，不再误导为发布态 installer 或 Marketplace rollout。
4. 下一条 primary stream 已切换到 `project-065-desktop-secondary-surface-productization-decision / sprint-001-secondary-surface-decision-and-packaging-boundary`。

## 3. Audit Scope

1. `sprint-001-packaged-distribution-and-extension-host-smoke`

## 4. Task Completion Statistics

1. Total implementation / closeout tasks in project scope: `5`
2. Latest `TK` status `completed` count: `5 / 5`
3. Latest `CR` status `resolved` count: `2 / 2`
4. Remaining implementation or governance gaps before project completion claim: `0`

## 5. Key Evidence

1. `./plan.md`
2. `./sprint-001-packaged-distribution-and-extension-host-smoke/plan.md`
3. `./sprint-001-packaged-distribution-and-extension-host-smoke/tasks/DA-704-sprint-001-closeout-and-project-final-review-activation-handoff.md`
4. `./sprint-001-packaged-distribution-and-extension-host-smoke/tasks/DA-705-project-064-final-closeout-and-project-065-primary-stream-activation.md`
5. `./sprint-001-packaged-distribution-and-extension-host-smoke/tasks/checklist.md`
6. `./sprint-001-packaged-distribution-and-extension-host-smoke/tasks/tasks.csv`
7. `./sprint-001-packaged-distribution-and-extension-host-smoke/review/resolved_code_review_working-tree-20260408-0731.md`
8. `./sprint-001-packaged-distribution-and-extension-host-smoke/review/resolved_code_review_working-tree-20260408-0745.md`
9. `../../../../README.md`
10. `../../../../README.zh-CN.md`
11. `../../../../apps/vscode-extension/README.md`
12. `../../../../docs/local-adoption-playbook.md`
13. `../../../../docs/local-adoption-playbook.zh-CN.md`
14. `../../../../docs/maintainer-validation-playbook.md`
15. `../../../../docs/maintainer-validation-playbook.zh-CN.md`
16. `../../../../docs/support-matrix.md`
17. `../../../../docs/support-matrix.zh-CN.md`
18. `../../../../scripts/release/pack-vscode-extension.js`
19. `../../../../scripts/release/verify-vscode-extension-distribution.js`
20. `../../../../scripts/release/verify-local-distribution.js`
21. `../../../../.repo-ai-governor/context/current-context.md`
22. `../../../../.repo-ai-governor/context/completed-streams-history.md`
23. `../../../../.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 6. Delivered Capability Summary

1. adopter 现在能明确区分 VS Code packaged secondary surface 只在已构建源码仓的“extension-development host / locally generated VSIX / packaged extension root”路径上正式支持，而不是已发布 tarball、direct installer 或 Marketplace。
2. `release:pack-vscode-extension` 与 `release:verify-vscode-extension-distribution` 现在为本地 VSIX / packaged root 提供统一的可复跑打包与验证报告，并固定了 archive structure 与 packaged module-resolution smoke。
3. README、local adoption playbook、maintainer validation playbook 与 support matrix 已不再保留“VS Code packaged path 完全 unsupported”或“已发布包自带 installable extension”的 narrative drift。

## 7. Verification Evidence

1. `pnpm run build`（通过）
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-064-vscode-extension-distribution-report.json`（通过）
5. `node ./scripts/release/verify-local-distribution.js --output .tmp/project-064-local-distribution-report.json`（通过）
6. `pnpm run check:ide-entry-smoke`（通过）
7. `pnpm run check:ide-docs-parity`（通过）
8. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
9. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
10. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
11. `node ./scripts/governance/check-worktree-review-target.js`（通过）
12. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）
13. `pnpm run check`（通过）

## 8. Next-stream Recommendation

1. 下一条 primary stream 固定为 `project-065-desktop-secondary-surface-productization-decision / sprint-001-secondary-surface-decision-and-packaging-boundary`。
2. `project-065` 应先冻结 desktop 是否继续 foundation-only 还是进入正式 secondary-surface 产品化路径，再决定是否做最小 seam 或更强的 public guardrails。
3. 后续队列继续保持不变：`project-066 -> project-068`。

## 9. Residual Risk And Follow-Up Advice

1. `project-064` 已完成 VS Code packaged secondary surface 的 truthful closeout，但 desktop decision、ecosystem pack expansion 与 `P2 deferred` reserved-target follow-up 仍需后续项目继续完成 adopter-facing closure。
2. 当前自动化证据仍止于本地打包、module-resolution smoke、docs parity 与整体 gate；若未来要把 GUI install/Marketplace 也纳入正式支持，需要单独在后续项目中补齐更强的 distribution evidence 与公开 support contract。
