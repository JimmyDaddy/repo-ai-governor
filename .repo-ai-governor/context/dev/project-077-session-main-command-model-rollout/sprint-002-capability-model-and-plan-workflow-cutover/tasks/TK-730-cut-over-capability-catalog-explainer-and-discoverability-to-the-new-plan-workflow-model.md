# TK-730 cut over capability catalog explainer and discoverability to the new plan workflow model

- Status: completed
- Date: 2026-04-10
- Owner: AI-Agent
- Priority: P0
- Project: `project-077-session-main-command-model-rollout`
- Sprint: `sprint-002-capability-model-and-plan-workflow-cutover`

## 1. 任务目标

让 capability catalog、explainer、help appendix 与 session-shell discoverability 一致表达 `/plan` 是 AI fixed workflow，`/plan sync` 是 deterministic bridge，`@planner` 是 raw role entry。

## 2. Depends On

1. `TK-729`
2. `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts`
3. `apps/cli/src/runtime/session-main-capability-discoverability-runtime.ts`

## 3. 预期产物

1. updated capability explainer wording
2. updated governed discoverability order and help copy
3. i18n coverage for the new planning surface

## 4. Required Inputs

1. `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts`
2. `apps/cli/src/runtime/session-main-capability-discoverability-runtime.ts`
3. `packages/shared/src/i18n/locales/en-us.ts`
4. `packages/shared/src/i18n/locales/zh-cn.ts`

## 5. Traceback References

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
2. `TK-729`

## 6. 实施计划

1. 从 capability explainer 中移除 public `verify` discoverability，并重写 `/plan` / `/plan sync` / `@planner` 的说明。
2. 调整 launcher/full discoverability，使 AI fixed workflow 与 deterministic utility 呈现分层更清晰。
3. 补齐 locale-neutral seed 与中英文 i18n 文案。

## 7. Development Verification

1. `pnpm run build`
2. `pnpm vitest packages/core-orchestration-service apps/cli/test/runtime/session-slash-command-registry.test.ts --run`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-10：任务创建，状态初始化为 `planned`。
2. 2026-04-10：从 public capability explainer / discoverability order 中移除 `verify`，并把 `/plan` detail/help wording 改写为 productized workflow、`/plan sync` deterministic bridge、`@planner` raw role 的三层心智。
3. 2026-04-10：补齐中英文 i18n 与 CLI help appendix consumer path，同时把 `runtime.cli-interactive-shell` 对 command-model contract 的 consumer 关系写回 canonical module registry。

## 10. 产出

1. 已完成：updated capability explainer wording
2. 已完成：updated discoverability and i18n coverage
