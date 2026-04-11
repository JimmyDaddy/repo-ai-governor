# TK-789 implement secret-backend abstraction and secure secret command mutation flow

- Status: completed
- Date: 2026-04-11
- Owner: AI-Agent
- Priority: P0
- Project: `project-089-local-user-config-and-secret-command-rollout`
- Sprint: `sprint-001-user-config-command-and-secret-foundation`

## 1. 任务目标

实现 secret-backend abstraction，并为 `secret` command family 建立 secure mutation flow 与禁止明文位置参数的 enforce baseline。

## 2. Depends On

1. `TK-788`

## 3. 预期产物

1. secret backend abstraction baseline
2. secure stdin / no-echo / env-import mutation flow
3. unsafe fallback warning baseline

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/local-user-config-and-secret-command-contract.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/local-user-config-defaults-and-secret-backed-credential-resolution.md`

## 5. 实施计划

1. 抽出 backend interface 与 mutation semantics。
2. 强制 `secret set` 只接受 secure input mode。
3. 为 fallback backend 增加 truthfulness warning。

## 6. Development Verification

1. `pnpm run build`
2. targeted secret command tests

## 7. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. 执行记录

1. 2026-04-11：任务通过 `DA-786` 创建，当前保持 `planned`，等待 `TK-788` 完成后执行。
2. 2026-04-11：已完成 `CliSecretService`、managed secret index、`macos-keychain` / `unsafe-local-file` backend abstraction，以及 `secret set|import|delete|list|status` command family 的 secure mutation flow。
3. 2026-04-11：`secret set` 现仅接受 `--stdin` 或 no-echo prompt，`secret import` 仅接受 `--from-env`，selector truth 固定为 `secret://<namespaced-key>`，明文 secret 不进入 `user-config.yaml` / `governor.yaml`。
4. 2026-04-11：验证已执行 `pnpm run build`、`pnpm vitest run apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/runtime/cli-user-config-service.test.ts`，进入 sprint-001 reviewer boundary。

## 9. 产出

1. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/commands/secret-command.ts`
2. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/secrets/cli-secret-backend.interface.ts`
3. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/secrets/cli-secret-index-service.ts`
4. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/secrets/cli-secret-service.ts`
5. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/secrets/macos-keychain-secret-backend.ts`
6. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/secrets/unsafe-local-file-secret-backend.ts`
7. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/types/interfaces/cli-secret-command.interface.ts`
