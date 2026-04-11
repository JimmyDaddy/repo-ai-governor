# TK-788 establish canonical user-config schema, migration, and config command storage semantics

- Status: completed
- Date: 2026-04-11
- Owner: AI-Agent
- Priority: P0
- Project: `project-089-local-user-config-and-secret-command-rollout`
- Sprint: `sprint-001-user-config-command-and-secret-foundation`

## 1. 任务目标

建立 `~/.repo-ai-governor/user-config.yaml` canonical schema、`cli-preferences.yaml` migration rule 与 `config` command 的 user-local storage semantics。

## 2. Depends On

1. `DA-786`

## 3. 预期产物

1. canonical user-config path / schema
2. migration strategy
3. `config` command storage baseline

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/local-user-config-and-secret-command-contract.md`
2. `.repo-ai-governor/draft/local-user-config-and-secret-backed-command-configuration-technical-solution.md`

## 5. 实施计划

1. 固定 canonical path 与最小 schema。
2. 明确 `config` 只写 user-local defaults，不写共享 `governor.yaml`。
3. 补齐 `cli-preferences.yaml -> user-config.yaml` migration truth。

## 6. Development Verification

1. `pnpm run build`
2. targeted config loader / writer verification

## 7. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. 执行记录

1. 2026-04-11：任务通过 `DA-786` 创建，当前保持 `planned`，等待 sprint-001 激活。
2. 2026-04-11：随着 `project-089 / sprint-001` 激活切换为 `in_progress`，先落 canonical `user-config.yaml` path、legacy `cli-preferences.yaml` migration seam 与 `config` command storage semantics。
3. 2026-04-11：已完成 canonical `~/.repo-ai-governor/user-config.yaml` path、`config get|set|unset|list|status` command、`workspace.mode_preference` / `tools.<surface>.remoteApi.*` authoring schema 与 legacy theme read-compat；`set-ui-theme` 现统一写回 canonical user-config path。
4. 2026-04-11：验证已执行 `pnpm run build`、`pnpm vitest run apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/runtime/cli-user-config-service.test.ts`，进入 sprint-001 reviewer boundary。

## 9. 产出

1. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/cli-user-config-service.ts`
2. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/commands/config-command.ts`
3. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/global-cli-theme-preference-service.ts`
4. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/types/interfaces/cli-user-config.interface.ts`
5. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/types/interfaces/cli-config-command.interface.ts`
6. `/Users/jimmydaddy/study/ai-governor/apps/cli/test/runtime/cli-user-config-service.test.ts`
