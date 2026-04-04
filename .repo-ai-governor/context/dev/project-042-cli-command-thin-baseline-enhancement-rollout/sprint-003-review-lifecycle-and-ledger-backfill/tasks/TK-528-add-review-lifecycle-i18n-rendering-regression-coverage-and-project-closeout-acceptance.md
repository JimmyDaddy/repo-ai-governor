# TK-528 add review lifecycle i18n rendering regression coverage and project closeout acceptance

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P0
- Project: `project-042-cli-command-thin-baseline-enhancement-rollout`
- Sprint: `sprint-003-review-lifecycle-and-ledger-backfill`

## 1. 任务目标

完成 `review / review-verify` 生命周期的 i18n 呈现、回归覆盖与项目级 closeout acceptance，使 `project-042` 最终以完整治理链路而不是分散实现片段收口。

## 2. Depends On

1. `TK-526`
2. `TK-527`
3. `.repo-ai-governor/draft/session-main-review-generation-verification-and-ledger-backfill-contract.md`
4. `apps/cli/src/commands/review-command.ts`
5. `apps/cli/src/commands/review-verify-command.ts`

## 3. 预期产物

1. `review` / `review-verify` presenter explainability 与 localized rendering baseline
2. review lifecycle regression coverage
3. `project-042` closeout acceptance 与 project completion audit 输入

## 4. Required Inputs

1. `.repo-ai-governor/draft/session-main-review-generation-verification-and-ledger-backfill-contract.md`
2. `apps/cli/src/commands/review-command.ts`
3. `apps/cli/src/commands/review-verify-command.ts`
4. `packages/shared/src/i18n/locales/en-us.ts`
5. `packages/shared/src/i18n/locales/zh-cn.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/sprint-003-review-lifecycle-and-ledger-backfill/plan.md`
3. `.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/sprint-003-review-lifecycle-and-ledger-backfill/tasks/TK-527-implement-review-verify-decision-artifact-transition-and-ledger-backfill.md`

## 6. 实施计划

1. 收口 `review` / `review-verify` 生命周期的用户可见语义、i18n 文案与 presenter rendering。
2. 为 findings / verify / resolved / backfill 链路补齐回归覆盖。
3. 形成 `project-042` closeout acceptance 与 completion audit 所需的证据骨架。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. 后续进入代码实现阶段需补 `check-i18n-parity-fallback`、review lifecycle regression 与必要 CR

## 8. Delivery Verification

1. 后续完成实现时必须补 `pnpm run build`
2. 后续完成实现时必须补 `node ./scripts/governance/check-i18n-parity-fallback.js`
3. 后续完成实现时必须补 review lifecycle regression / project closeout acceptance 证据

## 9. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；承接 `review` lifecycle i18n / regression / project closeout acceptance 收口。
2. 2026-04-04：同步 `review` / `review-verify` runtime integration 旧断言到 canonical artifact-first contract，补齐 review closeout artifact、delivery registry handoff 与 project-042 completion audit summary。
3. 2026-04-04：完成交付验证：`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-i18n-parity-fallback.js`、`node ./scripts/governance/check-technical-solution-delivery-registry.js`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`。
4. 2026-04-04：完成 working-tree CR 尾项收口：修复 `plan commit` 同标题漂移时的 canonical task id 回写缺口，并把 `code_review_working-tree-20260404-135652.md` 收口为 `resolved_code_review_working-tree-20260404-135652.md`。
5. 2026-04-04：修复 CI `pnpm install --frozen-lockfile` 失败：重新生成 `pnpm-lock.yaml`，补齐 `packages/core-agent-projection` 及其上游 importer 的 workspace 依赖投影，验证 `pnpm install --frozen-lockfile` 与 `pnpm run check` 均通过。
6. 2026-04-04：修复 `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts` 的 timeout budget 脆弱断言，将首轮 `cli_exec` 调用的验证调整为“不超过初始预算且保留近完整预算”，避免 CI 因 1ms 级剩余时间差异误判失败；验证 `pnpm exec vitest run packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`pnpm run check:full` 均通过。
7. 2026-04-04：修复 CLI `--help` 路径上的 SQLite experimental warning 污染：将 `doctor/verify` 的 durable diagnostics runtime 改为执行时按需加载，并把 `runCli()` 的 memory provider / governance runtime 初始化后移到真正的命令执行路径，避免 help/e2e/CI 因 eager sqlite loading 在 stderr 出现噪音；验证 `pnpm exec vitest run test/e2e/cli-help.e2e.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`node ./dist/bin/repo-ai-governor.js --help`（stderr 为 0 字节）、`pnpm run test:e2e`、`pnpm run check:full` 均通过。
8. 2026-04-04：进一步修复 CLI help 启动路径仍经由 `@repo-ai-governor/core-orchestration-service` 根导出链路触发 `node:sqlite` 静态加载的问题：把 capability 常量/类型改为子路径导入，并为 session-main capability catalog 增加 package export，彻底切断 help-only 场景对 sqlite checkpointer 的提前触达；同时将 `packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts` 的 timeout budget 断言放宽为“保留近完整预算但不超过初始预算”，消除 CI 上 1ms 级剩余时间抖动导致的误报；验证 `pnpm exec vitest run packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`pnpm run check:full` 均通过。
9. 2026-04-04：根据后续 review 意见加固 `apps/cli/test/commands/review-command.test.ts` 的 git fixture：在 `initGitRepository()` 中显式写入 `commit.gpgSign=false`，避免开发机或 CI 的全局 Git 配置开启 GPG 签名时让 `commitAll()` 产生环境依赖；验证 `pnpm exec vitest run apps/cli/test/commands/review-command.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build` 均通过。

## 10. 产出

1. `apps/cli/test/cli-governance-runtime.integration.test.ts`
2. `.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/sprint-003-review-lifecycle-and-ledger-backfill/review/resolved_review_tk-526-tk-528-review-lifecycle-productization.md`
3. `.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/project-042-cli-command-thin-baseline-enhancement-rollout-completion-audit-summary.md`
4. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
5. `.repo-ai-governor/context/dev/project-042-cli-command-thin-baseline-enhancement-rollout/sprint-003-review-lifecycle-and-ledger-backfill/review/resolved_code_review_working-tree-20260404-135652.md`
6. `pnpm-lock.yaml`
7. `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
8. `apps/cli/src/main.ts`
9. `apps/cli/src/commands/doctor-command.ts`
10. `apps/cli/src/commands/verify-command.ts`
11. `apps/cli/src/runtime/session-main-capability-discoverability-runtime.ts`
12. `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
13. `packages/core-orchestration-service/package.json`
14. `packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`
15. `apps/cli/test/commands/review-command.test.ts`
