# TK-797 add session shell config and secret discoverability plus command guidance

- Status: completed
- Date: 2026-04-11
- Owner: AI-Agent
- Priority: P1
- Project: `project-089-local-user-config-and-secret-command-rollout`
- Sprint: `sprint-003-connect-default-consumption-and-surface-discoverability`

## 1. 任务目标

为 session shell 补齐 `/config` 与 `/secret` discoverability、handoff affordance 与 command guidance，同时保持它们只是 surface shortcut。

## 2. Depends On

1. `TK-796`

## 3. 预期产物

1. shell discoverability baseline
2. command guidance copy
3. surface shortcut truthfulness

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/local-user-config-and-secret-command-contract.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`

## 5. 实施计划

1. 给 session shell 增加 discoverability affordance。
2. 复用同一 command contract 与 guidance copy。
3. 避免在 shell 内形成第二份 config truth。

## 6. Development Verification

1. `pnpm run build`
2. targeted shell command guidance verification

## 7. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. 执行记录

1. 2026-04-11：任务通过 `DA-786` 创建，当前保持 `planned`，等待 `TK-796` 完成后执行。
2. 2026-04-12：已完成 session shell `/config` 与 `/secret` discoverability、CLI command guidance 对齐与 slash-command handoff routing，并通过 `pnpm run build` 与 sprint-003 focused verification suite。

## 9. 产出

1. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
2. `/Users/jimmydaddy/study/ai-governor/apps/cli/test/runtime/session-slash-command-registry.test.ts`
