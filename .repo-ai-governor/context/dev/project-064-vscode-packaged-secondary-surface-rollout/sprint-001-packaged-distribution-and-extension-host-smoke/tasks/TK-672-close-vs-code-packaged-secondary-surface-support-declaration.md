# TK-672 close VS Code packaged secondary-surface support declaration

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-064-vscode-packaged-secondary-surface-rollout`
- Sprint: `sprint-001-packaged-distribution-and-extension-host-smoke`

## 1. 任务目标

用 smoke evidence、support-matrix refresh 与 adopter docs 对齐，正式关闭 VS Code packaged secondary-surface support declaration。

## 2. Depends On

1. `TK-670`
2. `TK-671`

## 3. 预期产物

1. support declaration
2. smoke evidence refresh
3. `project-065` input

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-064-vscode-packaged-secondary-surface-rollout/sprint-001-packaged-distribution-and-extension-host-smoke/tasks/TK-670-freeze-vs-code-packaged-distribution-contract-and-smoke-gate.md`
2. `.repo-ai-governor/context/dev/project-064-vscode-packaged-secondary-surface-rollout/sprint-001-packaged-distribution-and-extension-host-smoke/tasks/TK-671-implement-vsix-build-release-path-and-extension-host-smoke-followup.md`
3. `.repo-ai-governor/context/dev/project-065-desktop-secondary-surface-productization-decision/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/repo-ai-governor-current-app-feature-implementation-vs-baseline-priority-assessment.md`
2. `.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/project-054-vscode-secondary-surface-rollout-completion-audit-summary.md`

## 6. 实施计划

1. 刷新 support matrix 与 adopter-facing docs。
2. 记录 packaged secondary-surface smoke evidence。
3. 给 desktop decision 留下更明确的 secondary-surface边界输入。

## 7. Development Verification

1. support-matrix review
2. smoke evidence consistency check

## 8. Delivery Verification

1. packaged extension-host smoke
2. `pnpm run build`

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `planned`。
2. 2026-04-08：已将 app README、根 README、local adoption playbook、maintainer validation playbook 与 support matrix 的中英文版本收敛到同一条 narrative：VS Code secondary surface 正式支持“已构建源码仓 + extension-development host”与“已构建源码仓本地生成 VSIX / packaged extension root”，但不扩大为已发布 npm/tgz 安装器或 Marketplace 声明。
3. 2026-04-08：`scripts/release/verify-local-distribution.js` 的 truthfulness 断言已同步更新，并完成 `pnpm run check:ide-entry-smoke`、`pnpm run check:ide-docs-parity`、`pnpm exec biome check apps/vscode-extension/src apps/vscode-extension/test apps/vscode-extension/package.json apps/vscode-extension/README.md`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1` 与 `node ./scripts/release/verify-local-distribution.js --output .tmp/project-064-local-distribution-report.json` 验证。

## 10. 产出

1. `apps/vscode-extension/README.md`
2. `README.md`
3. `README.zh-CN.md`
4. `docs/local-adoption-playbook.md`
5. `docs/local-adoption-playbook.zh-CN.md`
6. `docs/maintainer-validation-playbook.md`
7. `docs/maintainer-validation-playbook.zh-CN.md`
8. `docs/support-matrix.md`
9. `docs/support-matrix.zh-CN.md`
10. `scripts/release/verify-local-distribution.js`
11. `.tmp/project-064-local-distribution-report.json`
12. `.tmp/project-064-vscode-extension-distribution-report.json`
