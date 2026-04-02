# project-036 completion audit summary

- Status: completed
- Date: 2026-04-02
- Project: `project-036-runtime-durable-storage-and-registry-cutover`

## 1. Scope Closed

1. runtime session durable truth 已切换到 `sqlite-fs` 默认路径，并完成 `session summary + append-only event records + diagnostic projection` 的运行时落地。
2. artifact registry / archive registry 已切换到 sqlite canonical truth，`artifacts.csv` 与 `artifacts.archive.csv` 退化为 rendered compatibility/export views。
3. `tasks.csv` 已建立 sqlite projection/read-model，governance 与 audit/query consumer 已优先消费 projection。
4. migration / doctor / verify / rebuild / render / cutover governance 已补齐，durable storage 多 surface 升级链路具备结构化验证与回滚边界。
5. adapter health-check / route-probe 已完成 formal promotion，并落地 layered contract、adapter rollout 与 CLI consumer 切换。

## 2. Delivered Outcomes

1. `sprint-001`：完成 sqlite-fs session durable truth 默认切换与 append-only session event log 语义迁移。
2. `sprint-002`：完成 artifact registry sqlite canonical truth 与 rendered CSV compatibility views。
3. `sprint-003`：完成 `tasks.csv` sqlite projection/read-model 与 audit/query consumer 切换。
4. `sprint-004`：完成 durable-storage diagnostics、cleanroom/runtime distribution 修复、artifact lifecycle auto-maintenance、layered adapter health-check contract、adapter probe rollout、doctor/verify/role fallback 切换。
5. post-closeout follow-up：完成 reviewer preflight 可见性与 probe concurrency 修补，`reviewer` 角色在真正 dispatch 前会先把 role preflight 与 surface probe 打进实时活动里。
6. post-closeout follow-up：完成 direct-answer probe hardening，adapter protocol 现在跨 turn 复用以保留 probe cache；同时“GitHub Copilot CLI 是否可用”这类问题会直接走目标 surface 的本地 availability probe，不再先探测全部 direct-answer surface 再调起 Codex。
7. post-closeout follow-up：完成 shared probe-cache hardening，workspace 级 shared protocol cache namespace 已接入 `session.main` 与 CLI governance runtime；即便 runtime 被重新构造，也会继续尝试复用已有 surface protocol 和 adapter probe cache。
8. post-closeout follow-up：完成 live activity 标签收口，session shell 的普通实时活动与 execution details 已移除 `Current/当前` 前缀，改为直接展示中性进度消息本身，避免 transcript 中继续暴露只在旧日志语境下才有意义的标签。
9. post-closeout follow-up：完成 live activity viewport hardening，运行中的 `live_activity` 改为受控窗口渲染；完整日志历史仍然保留，但 live shell 不会再随着流式日志无限长高，用户可以在任务进行中用 `PgUp/PgDn/Home/End` 浏览旧日志。
10. post-closeout follow-up：完成 agent reply history fix，`agent_message/token` 草稿现在会被镜像成可更新的 role reply 活动条目，并在 completed/failed turn execution details 中保留最新快照；reviewer 等角色的文本输出不再只停留在瞬时草稿区，而是能跟 command/todo/thinking 一起进入执行过程历史。
11. post-closeout follow-up：完成 timeout/liveness 技术方案 draft，明确后续 invoke 治理应从“固定 timeout 到点打断”转向“process liveness + transport activity + semantic progress + graceful interrupt + hard-timeout fuse”的统一状态机，并补齐一手外部资料作为决策依据。

## 3. Verification Evidence

1. `/opt/homebrew/bin/node ./node_modules/@biomejs/biome/bin/biome check packages/adapter-sdk/src/types/interfaces/agent-protocol.interface.ts packages/adapter-sdk/src/index.ts packages/adapter-sdk/src/types/index.ts packages/adapter-sdk/src/types/interfaces/index.ts packages/adapter-sdk/src/layered-health-check-runtime.ts packages/adapter-sdk/test/layered-health-check-runtime.unit.test.ts packages/adapters/codex/src/codex-agent-adapter.ts packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts packages/adapters/claude-code/src/claude-code-agent-adapter.ts packages/adapters/local-model/src/local-model-agent-adapter.ts apps/cli/src/types/interfaces/cli-adapter-verification.interface.ts apps/cli/src/runtime/adapter-verification-runtime.ts apps/cli/src/runtime/adapter-diagnostics-runtime.ts apps/cli/src/runtime/session-main-supervisor-runtime.ts scripts/governance/reconcile-artifact-dependencies.js scripts/governance/compact-artifact-registry.js scripts/governance/run-artifact-lifecycle-maintenance.js test/artifact-lifecycle-maintenance.integration.test.ts`
2. `/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run packages/adapter-sdk/test/layered-health-check-runtime.unit.test.ts packages/shared/test/shared-runtime.unit.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts test/artifact-lifecycle-maintenance.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `/opt/homebrew/bin/node ./node_modules/typescript/bin/tsc -p tsconfig.build.json && /opt/homebrew/bin/node ./scripts/build/copy-runtime-assets.js`
4. `/opt/homebrew/bin/node ./scripts/governance/check-artifact-registry-lifecycle.js`
5. `/opt/homebrew/bin/node ./scripts/governance/reconcile-artifact-dependencies.js --dry-run`
6. `/opt/homebrew/bin/node ./scripts/governance/run-artifact-lifecycle-maintenance.js --dry-run`
7. `/opt/homebrew/bin/node ./scripts/governance/check-task-ledger-sync.js`
8. `/opt/homebrew/bin/node ./scripts/governance/check-sprint-plan-status-sync.js`
9. `/opt/homebrew/bin/node ./scripts/governance/check-code-review-status-sync.js`
10. `/opt/homebrew/bin/node ./scripts/governance/check-worktree-review-target.js`
11. `/opt/homebrew/bin/node ./node_modules/@biomejs/biome/bin/biome check apps/cli/src/runtime/session-main-supervisor-runtime.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
12. `/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
13. `/opt/homebrew/bin/node ./node_modules/@biomejs/biome/bin/biome check apps/cli/src/runtime/adapter-routing-runtime.ts apps/cli/src/runtime/session-main-supervisor-runtime.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
14. `/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
15. `/opt/homebrew/bin/node ./node_modules/typescript/bin/tsc -p tsconfig.build.json && /opt/homebrew/bin/node ./scripts/build/copy-runtime-assets.js`
16. `/opt/homebrew/bin/node ./node_modules/@biomejs/biome/bin/biome check apps/cli/src/runtime/adapter-routing-runtime.ts apps/cli/src/runtime/session-main-supervisor-runtime.ts apps/cli/src/cli-governance-runtime.ts apps/cli/src/main.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts`
17. `/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`
18. `/opt/homebrew/bin/node ./node_modules/typescript/bin/tsc -p tsconfig.build.json && /opt/homebrew/bin/node ./scripts/build/copy-runtime-assets.js`
19. `PATH="/opt/homebrew/bin:/Users/jimmydaddy/Library/pnpm:$PATH" pnpm exec biome check packages/shared/src/i18n/locales/en-us.ts packages/shared/src/i18n/locales/zh-cn.ts apps/cli/test/runtime/session-shell-turn-progress-dock.test.ts apps/cli/test/runtime/react-cli-runner.test.ts apps/cli/test/runtime/session-shell-runner.test.ts`
20. `PATH="/opt/homebrew/bin:/Users/jimmydaddy/Library/pnpm:$PATH" pnpm exec vitest run apps/cli/test/runtime/session-shell-turn-progress-dock.test.ts apps/cli/test/runtime/react-cli-runner.test.ts apps/cli/test/runtime/session-shell-runner.test.ts --maxWorkers=1 --maxConcurrency=1`
21. `PATH="/opt/homebrew/bin:/Users/jimmydaddy/Library/pnpm:$PATH" pnpm run build`
22. `PATH="/opt/homebrew/bin:/Users/jimmydaddy/Library/pnpm:$PATH" pnpm exec biome check apps/cli/src/react-cli/views/session-shell-live-app.tsx apps/cli/test/runtime/session-shell-live-app.test.ts apps/cli/test/runtime/react-cli-runner.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-shell-turn-progress-dock.test.ts`
23. `PATH="/opt/homebrew/bin:/Users/jimmydaddy/Library/pnpm:$PATH" pnpm exec vitest run apps/cli/test/runtime/session-shell-live-app.test.ts apps/cli/test/runtime/react-cli-runner.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-shell-turn-progress-dock.test.ts --maxWorkers=1 --maxConcurrency=1`
24. `PATH="/opt/homebrew/bin:/Users/jimmydaddy/Library/pnpm:$PATH" pnpm run build`
25. `/opt/homebrew/bin/node ./node_modules/@biomejs/biome/bin/biome check apps/cli/src/runtime/interactive-shell/session-shell-turn-progress-dock.ts apps/cli/test/runtime/session-shell-turn-progress-dock.test.ts packages/shared/src/i18n/locales/en-us.ts packages/shared/src/i18n/locales/zh-cn.ts`
26. `/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run apps/cli/test/runtime/session-shell-turn-progress-dock.test.ts --maxWorkers=1 --maxConcurrency=1`
27. `/opt/homebrew/bin/node ./node_modules/typescript/bin/tsc -p tsconfig.build.json && /opt/homebrew/bin/node ./scripts/build/copy-runtime-assets.js`
28. `/opt/homebrew/bin/node ./scripts/governance/check-task-ledger-sync.js`
29. `/opt/homebrew/bin/node ./scripts/governance/check-sprint-plan-status-sync.js`
30. `/opt/homebrew/bin/node ./scripts/governance/check-task-ledger-sync.js`
31. `/opt/homebrew/bin/node ./scripts/governance/check-sprint-plan-status-sync.js`

## 4. Residual Notes

1. artifact lifecycle auto-maintenance 已具备批次摘要与 dry-run 能力；在当前仓库数据上 dry-run 会标记一批长期无依赖的 active artifacts 为 `deprecated`，后续执行 apply 前应结合运营节奏确认阈值。
2. 当前未激活下一条 primary execution stream，因此 `project-036 / sprint-004` 会临时保留为 closeout surface，直到新的主执行流被显式声明。
