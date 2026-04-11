# TK-796 consume user-config remote-api defaults in connect with analyze-first candidate materialization

- Status: completed
- Date: 2026-04-11
- Owner: AI-Agent
- Priority: P0
- Project: `project-089-local-user-config-and-secret-command-rollout`
- Sprint: `sprint-003-connect-default-consumption-and-surface-discoverability`

## 1. 任务目标

让 `connect` 在未提供更高优先级显式参数时 consume user-config remote-api defaults，并保持 analyze-first candidate materialization 与 canonical truth 不变。

## 2. Depends On

1. `TK-794`

## 3. 预期产物

1. connect defaults consumption baseline
2. candidate materialization truth
3. precedence-safe UX

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/local-user-config-defaults-and-secret-backed-credential-resolution.md`

## 5. 实施计划

1. 让 connect 按 precedence 读取 user-config defaults。
2. 继续输出 canonical onboarding truth，而不是 raw authoring path。
3. 缺 secret 时只给 guidance，不做隐式修复。

## 6. Development Verification

1. `pnpm run build`
2. targeted connect / onboarding tests

## 7. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. 执行记录

1. 2026-04-11：任务通过 `DA-786` 创建，当前保持 `planned`，等待 sprint-003 激活。
2. 2026-04-12：随着 `TK-795 / DA-795` 完成 sprint-002 closeout 与 activation handoff，当前任务切换为 `in_progress`，开始收口 `connect` 对 user-local remote-api defaults 的消费边界。
3. 2026-04-12：已完成 `connect` consume `user-config.yaml` remote-api defaults、analyze-first candidate materialization 与 CLI override precedence 保持，并通过 `pnpm run build` 与 sprint-003 focused verification suite。

## 9. 产出

1. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-user-config-projection-service.ts`
2. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/main.ts`
3. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/agent-onboarding-runtime.ts`
4. `/Users/jimmydaddy/study/ai-governor/apps/cli/test/connect-phase2.integration.test.ts`
