# DA-232 workspace lifecycle cli dry run execute rollback failure summary baseline

- Status: active
- Date: 2026-03-26
- Owner: AI-Agent
- Task: `TK-232`
- Project: `project-020-adoption-productization-and-upgrade-ux`
- Sprint: `sprint-003-upgrade-and-workspace-lifecycle-ux-baseline`

## 1. Summary

1. 新增正式 `workspace` CLI 命令，面向 adopter 提供 `dry-run / execute / rollback` 生命周期入口。
2. 该命令不再要求用户直接消费 `WorkspaceMigrationService` 底层接口；现在统一通过 CLI 完成：
   - 迁移 plan artifact 生成
   - execute artifact 与 rollback reference 输出
   - failure summary artifact 持久化
   - explicit rollback command path
3. `workspace` 命令已接入 runtime registry、CLI help、i18n 文案、JSON output contract 与 command/runtime tests。

## 2. Delivered Surface

1. [workspace-command.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/src/commands/workspace-command.ts)
   - 封装 `WorkspaceMigrationService.plan/execute/rollback`
   - 支持 `--workspace-action`、`--workspace-mode`、`--workspace-root`、`--workspace-plan`
   - 在 execute 失败时输出 deterministic failure summary artifact 并通过 standardized error 回传
2. [cli-command.constant.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/src/constants/cli-command.constant.ts)、[cli-governance-runtime.constant.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/src/constants/cli-governance-runtime.constant.ts)、[main.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/src/main.ts)
   - 完成命令注册、runtime operation、CLI flag 接线
3. [workspace-command.test.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/test/commands/workspace-command.test.ts)
   - 覆盖 dry-run、execute+rollback、failure summary

## 3. Validation

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run apps/cli/test/commands/workspace-command.test.ts apps/cli/test/commands/cli-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run check`

## 4. Key Outputs

1. [workspace-command.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/src/commands/workspace-command.ts)
2. [main.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/src/main.ts)
3. [workspace-command.test.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/test/commands/workspace-command.test.ts)
4. [cli-output-contract.integration.test.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/test/cli-output-contract.integration.test.ts)
