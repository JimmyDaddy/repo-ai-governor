# verified_review_tk-058-release-governance-and-canary-rc-ga-channel-baseline

- Status: verified
- Date: 2026-03-22
- Task: `TK-058`
- Scope: `release governance + canary/rc/ga channels baseline`

## 1. 审核结论

1. 通过。已完成 Stage 7 发布治理与通道基线，`release:check -> release:ga-check -> release:verify-local` 链路可执行，并登记 `DA-069`。

## 2. 已核验证据

1. 新增 `.repo-ai-governor/normative_knowledge_sources/governance/release-governance-spec.md`，固化 lockstep/independent、通道策略、回滚与审计证据要求。
2. 新增 `scripts/release/release-governance-policy.json` 与 `scripts/release/runtime-js-whitelist.json`，形成机器可读发布策略与运行时边界配置。
3. 新增 `scripts/release/check-release-ready.js`、`scripts/release/check-runtime-js-whitelist.js`、`scripts/release/verify-local-distribution.js`、`scripts/release/render-release-notes.js`。
4. 新增 `scripts/ci/check-coverage-thresholds.js` 与 `scripts/ci/coverage-thresholds.json`，补齐 `ci:quality` 覆盖率阈值检查。
5. `.release-it.json` `before:init` 已切换为 `pnpm run release:ga-check`，与仓库包管理策略一致。
6. `tsconfig.json` 与 `tsconfig.build.json` 已排除 `apps/**/dist`、`packages/**/dist`，解决递归 `dist/dist` 污染风险。
7. `normative-loading-manifest.yaml` 已注册 `release_governance_spec`，规范加载链路保持可检索。
8. `TK-058` 任务台账（task card/checklist/tasks.csv）与 `DA-069` 产物登记已同步完成。

## 3. 验证命令

1. `pnpm run release:check`（通过）
2. `pnpm run release:ga-check`（通过）
3. `pnpm run check`（通过）
4. `node ./scripts/governance/reconcile-artifact-dependencies.js`（通过）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
7. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）

## 4. 风险与后续

1. 当前覆盖率阈值为发布基线低门槛（5%）；可在 `TK-062` GA 联合门禁中按模块分层逐步上调阈值。
