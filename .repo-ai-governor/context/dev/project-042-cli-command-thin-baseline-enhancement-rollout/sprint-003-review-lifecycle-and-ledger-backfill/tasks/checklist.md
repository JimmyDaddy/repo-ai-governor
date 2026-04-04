# checklist

- [x] TK-526 implement review finding generation and lifecycle artifact truth baseline
  - 2026-04-04：任务创建，状态初始化为 `planned`；承接 `review` finding generation 与 lifecycle artifact truth 基线补强。
  - 2026-04-04：任务切换为 `active`；`sprint-002 plan` 已完成 closeout，当前开始盘点 `review-command` / `review-verify-command` 现状与 review lifecycle companion contract 之间的真实缺口。
  - 2026-04-04：完成 `review` lifecycle baseline 实现：新增 structured finding generator、canonical review artifact / queue transport 分层、review scope active-stream 路由与 file-level git changed-path 采集，修复 untracked code path 被目录级 porcelain 输出吞掉的问题。
  - 2026-04-04：完成验证：`pnpm exec vitest run apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts test/e2e/blackbox-governance-flow.e2e.test.ts test/sync-task-ledger.integration.test.ts test/task-ledger-projection.integration.test.ts --maxWorkers=1 --maxConcurrency=1`。
  - 2026-04-04：根据 working-tree CR 补修 `git status --porcelain` 普通未暂存路径截断，并把 active-stream repo-relative 路由统一绑定到 `workspace.repositoryRoot`，补齐 `review-command` 与 `plan` 的子目录调用回归覆盖。
- [x] TK-527 implement review-verify decision artifact transition and ledger backfill
  - 2026-04-04：任务创建，状态初始化为 `planned`；承接 `review-verify` 决策迁移与 ledger backfill 实现。
  - 2026-04-04：完成 `review-verify` lifecycle 实现：accepted/rejected finding projection、verified/resolved artifact transition、queued/open/resolved request 状态、`not_requested/applied/failed` ledger backfill 投影与 service-backed summary/update 对齐。
  - 2026-04-04：完成验证：`pnpm exec vitest run apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts test/e2e/blackbox-governance-flow.e2e.test.ts test/sync-task-ledger.integration.test.ts test/task-ledger-projection.integration.test.ts --maxWorkers=1 --maxConcurrency=1`。
  - 2026-04-04：根据 working-tree CR 同步将 `review-verify` 的 changed-path / artifact 路由切到 `workspace.repositoryRoot`，并保留 resolved no-op 请求默认不抢占未解决 review 的队列优先级回归覆盖。
- [x] TK-528 add review lifecycle i18n rendering regression coverage and project closeout acceptance
  - 2026-04-04：任务创建，状态初始化为 `planned`；承接 `review` lifecycle i18n / regression / project closeout acceptance 收口。
  - 2026-04-04：同步 `review` / `review-verify` runtime integration 旧断言到 canonical artifact-first contract，补齐 review closeout artifact、delivery registry handoff 与 project-042 completion audit summary。
  - 2026-04-04：完成交付验证：`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-i18n-parity-fallback.js`、`node ./scripts/governance/check-technical-solution-delivery-registry.js`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`。
  - 2026-04-04：完成 working-tree CR 尾项收口：修复 `plan commit` 同标题漂移时的 canonical task id 回写缺口，并把 `code_review_working-tree-20260404-135652.md` 收口为 `resolved_code_review_working-tree-20260404-135652.md`。
  - 2026-04-04：修复 CI `pnpm install --frozen-lockfile` 失败：重新生成 `pnpm-lock.yaml`，补齐 `packages/core-agent-projection` 及其上游 importer 的 workspace 依赖投影，验证 `pnpm install --frozen-lockfile` 与 `pnpm run check` 均通过。
  - 2026-04-04：修复 `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts` 的 timeout budget 脆弱断言，将首轮 `cli_exec` 调用的验证调整为“不超过初始预算且保留近完整预算”，避免 CI 因 1ms 级剩余时间差异误判失败；验证 `pnpm exec vitest run packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`pnpm run check:full` 均通过。
  - 2026-04-04：修复 CLI `--help` 路径上的 SQLite experimental warning 污染：将 `doctor/verify` 的 durable diagnostics runtime 改为执行时按需加载，并把 `runCli()` 的 memory provider / governance runtime 初始化后移到真正的命令执行路径，避免 help/e2e/CI 因 eager sqlite loading 在 stderr 出现噪音；验证 `pnpm exec vitest run test/e2e/cli-help.e2e.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`node ./dist/bin/repo-ai-governor.js --help`（stderr 为 0 字节）、`pnpm run test:e2e`、`pnpm run check:full` 均通过。
  - 2026-04-04：进一步修复 CLI help 启动路径仍经由 `@repo-ai-governor/core-orchestration-service` 根导出链路触发 `node:sqlite` 静态加载的问题：把 capability 常量/类型改为子路径导入，并为 session-main capability catalog 增加 package export，彻底切断 help-only 场景对 sqlite checkpointer 的提前触达；同时将 `packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts` 的 timeout budget 断言放宽为“保留近完整预算但不超过初始预算”，消除 CI 上 1ms 级剩余时间抖动导致的误报；验证 `pnpm exec vitest run packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`pnpm run check:full` 均通过。
  - 2026-04-04：继续收口 CI 尾项：切断 CLI help 路径经由 core-orchestration-service 根导出触发的 sqlite 提前加载，并将 github-copilot cli_exec smoke 的 timeout budget 断言调整为允许 1ms 级剩余预算抖动；验证 
 RUN  v4.1.0 /Users/jimmydaddy/study/ai-governor


 Test Files  1 passed (1)
      Tests  17 passed (17)
   Start at  17:43:04
   Duration  1.44s (transform 584ms, setup 0ms, import 708ms, tests 285ms, environment 0ms)、
> @cjhdev/repo-ai-governor@0.1.5 build /Users/jimmydaddy/study/ai-governor
> tsc -p tsconfig.build.json && node ./scripts/build/copy-runtime-assets.js、
> @cjhdev/repo-ai-governor@0.1.5 check:full /Users/jimmydaddy/study/ai-governor
> node ./scripts/ci/run-gate-check.js --profile full

[gate-check] profile=full task=gate:check started at 2026-04-04T09:43:23.413Z
   • Packages in scope: //, @repo-ai-governor/adapter-claude-code, @repo-ai-governor/adapter-codex, @repo-ai-governor/adapter-github-copilot, @repo-ai-governor/adapter-local-model, @repo-ai-governor/adapter-sdk, @repo-ai-governor/artifact-registry, @repo-ai-governor/cli, @repo-ai-governor/config, @repo-ai-governor/core-agent-projection, @repo-ai-governor/core-change-risk, @repo-ai-governor/core-memory, @repo-ai-governor/core-memory-semantics, @repo-ai-governor/core-orchestration-service, @repo-ai-governor/core-policy, @repo-ai-governor/core-process, @repo-ai-governor/core-role-registry, @repo-ai-governor/core-runtime, @repo-ai-governor/core-runtime-langgraph, @repo-ai-governor/core-session, @repo-ai-governor/memory-provider-fs-csv, @repo-ai-governor/memory-provider-registry, @repo-ai-governor/memory-provider-sqlite-fs, @repo-ai-governor/memory-store-adapter, @repo-ai-governor/notification-dispatcher, @repo-ai-governor/notification-provider-chat-im, @repo-ai-governor/notification-provider-webhook, @repo-ai-governor/orchestration-service-client, @repo-ai-governor/reporting, @repo-ai-governor/shared, @repo-ai-governor/slots, @repo-ai-governor/standards
   • Running gate:check in 32 packages
   • Remote caching disabled
 Tasks:    32 successful, 32 total
Cached:    0 cached, 32 total
  Time:    34.548s 
[gate-check] profile=full status=PASSED elapsed=34.9s 均通过。
