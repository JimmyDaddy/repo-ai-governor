# TK-790 land macOS keychain baseline, shared i18n/error wiring, and unsafe-fallback warnings

- Status: completed
- Date: 2026-04-11
- Owner: AI-Agent
- Priority: P1
- Project: `project-089-local-user-config-and-secret-command-rollout`
- Sprint: `sprint-001-user-config-command-and-secret-foundation`

## 1. 任务目标

收口 macOS keychain baseline、shared i18n / standardized error wiring 与 unsafe fallback warning 文案，使 sprint-001 具备真实可用的 foundation。

## 2. Depends On

1. `TK-789`

## 3. 预期产物

1. macOS keychain backend baseline
2. shared i18n keys and error codes
3. warning / guidance copy baseline

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/local-user-config-and-secret-command-contract.md`

## 5. 实施计划

1. 先收敛 macOS default backend。
2. 将用户可见错误和 guidance 接到 shared i18n / error model。
3. 固化 unsafe fallback high-noise warning。

## 6. Development Verification

1. `pnpm run build`
2. targeted CLI / i18n / error coverage

## 7. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. 执行记录

1. 2026-04-11：任务通过 `DA-786` 创建，当前保持 `planned`，等待 `TK-789` 完成后执行。
2. 2026-04-11：已完成 macOS default backend baseline、CLI runtime wiring、shared i18n 文案接入，以及 `unsafe-local-file` backend 的高噪声 warning / status surface。
3. 2026-04-11：`config` / `secret` command 已接入 main/runtime command registry、output operation constants 与 shared locale keys，foundation 行为可通过 pretty/plain/json output contract 消费。
4. 2026-04-11：验证已执行 `pnpm run build`、`pnpm vitest run apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/runtime/cli-user-config-service.test.ts`，进入 sprint-001 reviewer boundary。

## 9. 产出

1. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/main.ts`
2. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/cli-governance-runtime.ts`
3. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/constants/cli-command.constant.ts`
4. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/constants/cli-governance-runtime.constant.ts`
5. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/constants/cli-output.constant.ts`
6. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/types/interfaces/cli-governance-runtime.interface.ts`
7. `/Users/jimmydaddy/study/ai-governor/packages/shared/src/i18n/locales/en-us.ts`
8. `/Users/jimmydaddy/study/ai-governor/packages/shared/src/i18n/locales/zh-cn.ts`
