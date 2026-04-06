# GA Readiness 证据总览（主执行计划 §10.2）

- 状态：active
- 证据日期：2026-04-05
- 范围：`project-026 / sprint-004 / TK-302`，并由 `project-046 / sprint-001 / TK-555` 刷新

## 1. 汇总

- 总信号数：11
- Pass：11 / 11
- Conditional pass：0 / 11
- Fail：0 / 11
- 当前 adopter / maintainer surface 的公开 support truth 已在 `project-052 / sprint-003 / TK-596` 窗口收敛到 `docs/support-matrix.md` 与 `docs/support-matrix.zh-CN.md`；本文件继续承担 program-level signal matrix 角色，而不是再维护一份平行的公开支持声明。

## 2. 信号矩阵

| 信号 | 要求 | 状态 | 证据 |
|---|---|---|---|
| #1 | 至少 2 个试点仓库在 15 分钟内完成一条正式支持的 onboarding 链（`install` 或支持的 `dist` binary rehearsal）-> `init -> doctor -> check` | Pass | `.tmp/project-046-p1-ga-onboarding-timing.json` 已固化统一的单仓库耗时指标行：`playground-link=2423ms`、`react-native-image-marker-dist=1136ms`，均显著低于 15 分钟阈值。 |
| #2 | 选定两种安装模式在 clean-room 下各连续 3 次通过 | Pass | `.tmp/project-026-sprint-004/tk302-cleanroom-path-link-report.json`（`path` 3/3、`link` 3/3，命令链 `--help -> init -> doctor -> check`）。 |
| #3 | 黑盒用户路径矩阵 `init -> doctor -> check -> run -> report/replay` 100% 通过 | Pass | `pnpm vitest run --config vitest.e2e.config.ts test/e2e/blackbox-governance-flow.e2e.test.ts test/e2e/cli-help.e2e.test.ts --maxWorkers=1 --maxConcurrency=1`（2 文件、4 用例全部通过）。 |
| #4 | 至少 1 条无人值守 `plan -> run -> review -> review-verify -> report -> ledger backfill` 链路连续 3 次 rehearsal 通过 | Pass | `.tmp/project-026-sprint-004/tk302-stage9-blackbox-ga-report.json`（`delivery_rehearsal_eligible_scenarios=3`，`delivery_rehearsal_pass_scenarios=3`，并且相关场景 `inlineReviewChainStatus=applied`）。 |
| #5 | 试点期人工介入与失败事件具备结构化归因 | Pass | Stage9 报告已对场景输出结构化字段：`runtimeStatus`、`hitlRequired`、`hitlDecision`、`localFallbackActivated`、`deliveryRehearsalStatus`。 |
| #6 | 至少 1 组 clean-room `tool_managed -> repo_local -> rollback` workspace 切换通过 | Pass | `.tmp/project-026-sprint-004/tk302-cleanroom-path-link-report.json`（`workspaceSwitchRollback.status=passed`）。 |
| #7 | 至少 1 组外部消费契约黑盒矩阵通过（配置优先级 + workspace/i18n precedence + public exports） | Pass | `pnpm vitest run --config vitest.integration.config.ts test/public-package-exports.integration.test.ts test/memory-store-config-and-cli-composition.integration.test.ts --maxWorkers=1 --maxConcurrency=1` + `pnpm vitest run --config vitest.packages.config.ts apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（全部通过）。 |
| #8 | 至少 1 主 1 备 HITL 通知渠道 rehearsal 通过并可回链 audit/replay | Pass | `.repo-ai-governor/context/dev/project-026-prd-gap-remediation/sprint-001-ga-blocker-notification-provider-implementation/hitl-notification-rehearsal-evidence.md`。 |
| #9 | 至少 1 条受控 delivery rehearsal 覆盖 `commit` 或 `PR draft` 并记录边界 | Pass | Stage9 报告同时产出 `*.pr_draft.json` 与 `*.commit.json` delivery rehearsal 证据。 |
| #10 | 已声明最小支持矩阵并记录矩阵内 clean-room smoke | Pass | `docs/support-matrix.md` 与 `docs/support-matrix.zh-CN.md`（TK-301 产物）。 |
| #11 | 运营指标快照可用（接入耗时、违规率、无人值守成功率、回滚率、人工介入率） | Pass | Stage9 指标快照已具备（`time_to_first_success_ms`、`unattended_success_rate`、`human_intervention_rate`、`fallback_rate`、`delivery_rehearsal_pass_rate`），且仓库级验证基线已于 2026-03-28 复核通过（`pnpm run check`、`pnpm run test:coverage`）。 |

## 3. 证据快照

1. `node ./scripts/release/verify-cleanroom-local-install.js --modes path,link --iterations 3 --output .tmp/project-026-sprint-004/tk302-cleanroom-path-link-report.json`
2. `pnpm vitest run --config vitest.e2e.config.ts test/e2e/blackbox-governance-flow.e2e.test.ts test/e2e/cli-help.e2e.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/ci/run-stage9-blackbox-ga-baseline.js --output .tmp/project-026-sprint-004/tk302-stage9-blackbox-ga-report.json`
4. `pnpm vitest run --config vitest.integration.config.ts test/public-package-exports.integration.test.ts test/memory-store-config-and-cli-composition.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
5. `pnpm vitest run --config vitest.packages.config.ts apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
6. `.tmp/project-046-p1-ga-onboarding-timing.json`

## 4. 后续待办

1. 持续保持仓库级验证基线的周期性快照：
   - `pnpm run check` 与 `pnpm run test:coverage` 已在 2026-03-28 通过补强治理脚本/示例脚本引号兼容后恢复为通过状态。
2. 当支持的 onboarding 命令链或 pilot 入口模式发生实质变化时，重新刷新 `.tmp/project-046-p1-ga-onboarding-timing.json`。
