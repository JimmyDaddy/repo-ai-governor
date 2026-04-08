# TK-715 add governed branch-switch execution path for session.main

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-073-direct-answer-stability-and-governed-branch-switch-remediation`
- Sprint: `sprint-001-direct-answer-stability-and-branch-switch`

## 1. 任务目标

为 `session.main` 补齐“切换到 `main` 分支”这类工作区动作的受治理执行路径，让请求不再只能落入 chat-only 拒绝，而是进入可解释、可确认、可执行的能力链路。

## 2. Depends On

1. `TK-714`
2. `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-catalog.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`

## 3. 预期产物

1. session.main 的新 capability / router / execution path
2. 受治理的分支切换命令或预览确认链路
3. 对应测试、验证证据与用户可见行为说明

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
4. `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-catalog.ts`
5. `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-073-direct-answer-stability-and-governed-branch-switch-remediation/plan.md`
2. `.repo-ai-governor/context/dev/project-073-direct-answer-stability-and-governed-branch-switch-remediation/sprint-001-direct-answer-stability-and-branch-switch/plan.md`
3. `TK-714`

## 6. 实施计划

1. 定义“分支切换”在 session.main 中的 capability / command routing 归属。
2. 落地受治理执行或 preview-confirm 路径，并保持 workspace safety / git-state truthfulness。
3. 补齐能力说明、路由与执行测试，并记录 build + delivery gate 证据。

## 7. Development Verification

1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/sync-task-ledger.js --task-id TK-715 --tasks-dir ".repo-ai-governor/context/dev/project-073-direct-answer-stability-and-governed-branch-switch-remediation/sprint-001-direct-answer-stability-and-branch-switch/tasks"`
4. `node ./scripts/governance/check-task-ledger-sync.js`
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`
6. `pnpm run check`

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `planned`，等待 `TK-714` clean 后进入执行窗口。
2. 2026-04-08：`TK-714` 与 `CR-001` 边界已 clean，当前任务切换为 `in_progress`，开始为 “切换到 main 分支” 补齐 session.main 的受治理 handoff + execution path。
3. 2026-04-08：已将“切换到 main / checkout main”补齐为 `session.main` 的新 governed capability，并打通 `/workspace switch-branch <branch>` 的 preview-confirm handoff、CLI discoverability、`workspace` 本地分支切换执行与 receipt artifact 写入路径。
4. 2026-04-08：已补齐 capability/dispatcher/shell/slash-registry/workspace-command/runtime 集成回归测试，并通过 `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1` 与 `pnpm run build`；当前任务状态切换为 `completed`，下一边界进入 fresh reviewer CR loop。
5. 2026-04-08：`CR-002` 至 `CR-005` 已完成 fresh reviewer 循环并全部 `resolved`；第 5 轮 reviewer 未发现新的 actionable findings，当前任务边界 clean，下一边界切换为 `TK-716` sprint closeout / project-final review activation handoff。

## 10. 产出

1. `packages/core-orchestration-service/src/constants/session-main-capability.constant.ts`
2. `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-catalog.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts`
4. `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
5. `packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts`
6. `apps/cli/src/runtime/session-main-capability-discoverability-runtime.ts`
7. `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
8. `apps/cli/src/commands/workspace-command.ts`
9. `apps/cli/src/cli-governance-runtime.ts`
10. `apps/cli/src/constants/cli-workspace.constant.ts`
11. `apps/cli/src/constants/cli-governance-runtime.constant.ts`
12. `apps/cli/src/main.ts`
13. `packages/shared/src/i18n/locales/en-us.ts`
14. `packages/shared/src/i18n/locales/zh-cn.ts`
15. `packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts`
16. `packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts`
17. `packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`
18. `packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
19. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
20. `apps/cli/test/runtime/session-slash-command-registry.test.ts`
21. `apps/cli/test/commands/workspace-command.test.ts`
22. `apps/cli/test/cli-governance-runtime.integration.test.ts`
