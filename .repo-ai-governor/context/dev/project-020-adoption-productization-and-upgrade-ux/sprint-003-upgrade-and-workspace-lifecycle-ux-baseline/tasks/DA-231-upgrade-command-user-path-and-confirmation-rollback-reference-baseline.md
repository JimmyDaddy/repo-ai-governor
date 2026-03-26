# DA-231 upgrade command user path and confirmation rollback reference baseline

- Status: active
- Date: 2026-03-26
- Owner: AI-Agent
- Task: `TK-231`
- Project: `project-020-adoption-productization-and-upgrade-ux`
- Sprint: `sprint-003-upgrade-and-workspace-lifecycle-ux-baseline`

## 1. Summary

1. `upgrade` 命令已从“仅输出 schema diff artifact”提升为 adopter-facing CLI 用户路径。
2. 当前输出面明确包含：
   - schema diff summary
   - migration suggestions count
   - confirmation items / blocking confirmation count
   - explicit rollback snapshot reference
   - auto-migrated config artifact
3. CLI pretty/plain/json 三种输出都能消费同一套结构化结果，不再要求 adopter 先手工打开原始 diff JSON 才知道下一步做什么。

## 2. Delivered Surface

1. [upgrade-command.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/src/commands/upgrade-command.ts)
   - 新增 `upgrade_report`、`upgrade_auto_migrated_config`、`upgrade_rollback_snapshot`
   - 将 confirmation decision 与 rollback reference 纳入 checks / details / experience prompts
2. [cli-governance-runtime.integration.test.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/test/cli-governance-runtime.integration.test.ts)
   - 补充 upgrade adopter-facing artifact coverage
3. [cli-output-contract.integration.test.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/test/cli-output-contract.integration.test.ts)
   - 保持 CLI JSON contract 在新增 workspace/upgrade UX 后仍稳定

## 3. Validation

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run apps/cli/test/commands/workspace-command.test.ts apps/cli/test/commands/cli-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run check`

## 4. Key Outputs

1. [upgrade-command.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/src/commands/upgrade-command.ts)
2. [cli-governance-runtime.integration.test.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/test/cli-governance-runtime.integration.test.ts)
3. [cli-output-contract.integration.test.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/test/cli-output-contract.integration.test.ts)
