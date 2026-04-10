# TK-734 add `/verify` removal migration guidance and follow-up routing

- Status: completed
- Date: 2026-04-10
- Owner: AI-Agent
- Priority: P1
- Project: `project-077-session-main-command-model-rollout`
- Sprint: `sprint-003-review-workflow-and-verify-removal`

## 1. 任务目标

把旧 verify 请求迁移到 `connect` follow-up、`doctor` 或 internal readiness gate，并为用户暴露清晰的迁移文案与错误提示。

## 2. Depends On

1. `TK-733`
2. `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts`
3. `packages/shared/src/i18n/locales/en-us.ts`

## 3. 预期产物

1. verify migration routing
2. explainer/error-copy updates
3. migration regressions

## 4. Required Inputs

1. `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
2. `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts`
3. `packages/shared/src/i18n/locales/en-us.ts`
4. `packages/shared/src/i18n/locales/zh-cn.ts`

## 5. Traceback References

1. `TK-733`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`

## 6. 实施计划

1. 为 verify-like 自然语言请求建立 migration routing，不再落到 removed public command。
2. 补齐 `/verify` 已删除的解释文案与替代入口说明。
3. 为 migration copy 与 follow-up routing 增加回归覆盖。

## 7. Development Verification

1. `pnpm run build`
2. `pnpm vitest packages/core-orchestration-service apps/cli/test/runtime/session-main-supervisor-runtime.test.ts --run`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-10：任务创建，状态初始化为 `planned`。
2. 2026-04-10：把 verify-like 自然语言请求迁移到 `/doctor` follow-up，并在 explainer、session parity、CLI output contract 中补齐 `/verify` 已删除后的替代入口说明。
3. 2026-04-10：为 removed `verify` command 增加稳定 JSON error contract 覆盖，为 profile-only adapter baseline 改由 `doctor` 验证。
4. 2026-04-10：结合 build、`pnpm run test:packages` 与 `pnpm run test:integration` 验证 migration routing 与 follow-up copy 没有引入回归。

## 10. 产出

1. 已完成：verify migration routing
2. 已完成：explainer/error-copy updates
