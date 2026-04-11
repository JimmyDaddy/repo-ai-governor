# TK-761 remove shell-owned preview-confirm default for governed session commands

- Status: completed
- Date: 2026-04-11
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-080-session-shell-direct-handoff-default`
- Sprint: `sprint-001-remove-shell-preview-confirm-default`

## 1. 任务目标

将 session shell 的默认 governed command handoff 从壳层 `preview + confirm` 收敛回 `direct_execute`，同时解释清楚 `connect` 案例真正的失败原因是配置缺失而非确认流程本身。

## 2. Depends On

1. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
2. `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-catalog.ts`
4. `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`

## 3. 预期产物

1. 默认直执的 session.main capability / slash-command 路由实现
2. 同步后的 shell/orchestration 规范与 adoption playbook
3. 覆盖该行为变化的 i18n 与回归测试证据

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/module-overview.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-080-session-shell-direct-handoff-default/plan.md`
2. `.repo-ai-governor/context/dev/project-080-session-shell-direct-handoff-default/sprint-001-remove-shell-preview-confirm-default/plan.md`
3. `apps/cli/src/runtime/agent-onboarding-runtime.ts`

## 6. 实施计划

1. 先确认用户案例里 `connect` 失败的 runtime 根因，区分“配置缺失失败”和“交互过度啰嗦”这两个问题。
2. 将 `connect / workspace switch-branch / run / workflow / plan sync` 的默认 handoff 模式统一切换到 `direct_execute`，并把 `/confirm`、`/cancel` 降级为隐藏兼容 builtin。
3. 同步 i18n、技术方案文档、adoption 文档与回归测试，确保默认交互与规范描述一致。

## 7. Development Verification

1. `pnpm exec vitest run apps/cli/test/runtime/session-main-parity.integration.test.ts apps/cli/test/runtime/session-shell-ink-controller.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`

## 8. Delivery Verification

1. `pnpm exec vitest run apps/cli/test/runtime/session-main-parity.integration.test.ts apps/cli/test/runtime/session-shell-ink-controller.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. `node ./scripts/governance/sync-task-ledger.js --task-id TK-761 --tasks-dir ".repo-ai-governor/context/dev/project-080-session-shell-direct-handoff-default/sprint-001-remove-shell-preview-confirm-default/tasks"`
4. `node ./scripts/governance/check-task-ledger-sync.js`
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-11：任务创建并直接进入 `in_progress`，范围锁定为“解释失败根因 + 移除默认 preview-confirm 冗余交互”。
2. 2026-04-11：已确认用户案例中的 `connect` 失败根因来自 `apps/cli/src/runtime/agent-onboarding-runtime.ts` 对 `sourceConfig.adapters` 的前置校验；当 source config 缺少 `adapters` baseline 时，runtime 会抛出 `ADAPTER_ROUTE_CONFIG_INVALID`。
3. 2026-04-11：已将 `connect`、`workspace switch-branch`、`run`、`workflow`、`plan sync` 的默认 handoff 模式收敛为 `direct_execute`，同时把 `/confirm`、`/cancel` 改为 hidden compatibility builtins，避免继续占据默认 discoverability 与快捷提示。
4. 2026-04-11：已同步 capability catalog、onboarding bundle、session shell 文案、runtime shell/orchestration 规范和 adoption playbook，并通过 targeted vitest 与 `pnpm run build`；当前任务状态切换为 `completed`。

## 10. 产出

1. `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
2. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-catalog.ts`
4. `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
5. `packages/shared/src/i18n/locales/en-us.ts`
6. `packages/shared/src/i18n/locales/zh-cn.ts`
7. `apps/cli/test/runtime/session-main-parity.integration.test.ts`
8. `apps/cli/test/runtime/session-shell-ink-controller.test.ts`
9. `apps/cli/test/runtime/session-shell-runner.test.ts`
10. `apps/cli/test/runtime/session-slash-command-registry.test.ts`
11. `packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
12. `packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts`
13. `packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`
14. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
15. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
16. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/adrs/session-first-shell-and-service-owned-session-state.md`
17. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
18. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/session-main-supervisor-and-role-subagent-collaboration.md`
19. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/module-overview.md`
20. `docs/local-adoption-playbook.md`
21. `docs/local-adoption-playbook.zh-CN.md`
