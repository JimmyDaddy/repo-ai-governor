# TK-773 add command-based remote_api authoring to connect onboarding flow

- Status: completed
- Date: 2026-04-11
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-085-command-based-remote-api-configuration`
- Sprint: `sprint-001-connect-command-remote-api-authoring`

## 1. 任务目标

让 `connect` 在首次启用 `remote_api` 时即可通过命令参数生成所需的 remote-api 配置，而不再要求用户先手写 `governor.yaml`。

## 2. Depends On

1. `apps/cli/src/main.ts`
2. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
3. `packages/config/src/schema-validator.ts`

## 3. 预期产物

1. `connect` remote_api authoring CLI 参数
2. onboarding runtime 候选配置合成与校验补强
3. CLI help / 用户文档 / regression tests

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
4. `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
5. `apps/cli/src/runtime/agent-onboarding-runtime.ts`

## 5. Traceback References

1. `docs/local-adoption-playbook.zh-CN.md`
2. `packages/config/test/config.unit.test.ts`
3. `.repo-ai-governor/context/dev/project-085-command-based-remote-api-configuration/plan.md`

## 6. 实施计划

1. 设计 `connect` 的 remote_api authoring 参数语义，并复用现有 `toolId=value` 风格。
2. 在 CLI parser 与 onboarding runtime 中合成 per-tool remoteApi 配置，并保持 surface-aware 默认值。
3. 更新帮助文案、用户文档与回归测试，验证首次配置路径可通过命令完成。

## 7. Development Verification

1. `pnpm exec vitest run apps/cli/test/connect-phase2.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm exec vitest run apps/cli/test/connect-phase2.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts packages/config/test/config.unit.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. `node ./scripts/governance/sync-task-ledger.js --task-id TK-773 --tasks-dir ".repo-ai-governor/context/dev/project-085-command-based-remote-api-configuration/sprint-001-connect-command-remote-api-authoring/tasks"`
4. `node ./scripts/governance/check-task-ledger-sync.js`
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-11：任务创建并直接进入 `in_progress`，范围锁定为 `connect` 首次 remote_api 命令式配置能力。
2. 2026-04-11：在 `main.ts` 中补齐 `--remote-api-model`、`--remote-api-credential-env-var`、`--remote-api-endpoint` 的解析、runtime debug plumbing 与 connect help discoverability。
3. 2026-04-11：在 onboarding runtime 中补齐首次 `remote_api` 候选配置合成逻辑，让 `codex` / `claude-code` 可基于命令输入直接生成 provider/vendorBinding/env-var 默认值。
4. 2026-04-11：补充 runtime、CLI integration 与 help-output regression tests，并同步更新 CLI README 与本地接入文档，明确真实 API key 仍来自外部环境变量。
5. 2026-04-11：执行指定 vitest 回归集与 `pnpm run build`，验证通过。

## 10. 产出

1. 已完成：connect remote_api authoring CLI 参数与 help discoverability -> `apps/cli/src/main.ts`
2. 已完成：onboarding runtime / parser / regression coverage -> `apps/cli/src/runtime/agent-onboarding-runtime.ts`、`apps/cli/test/runtime/agent-onboarding-runtime.test.ts`、`apps/cli/test/connect-phase2.integration.test.ts`、`apps/cli/test/cli-output-contract.integration.test.ts`
3. 已完成：用户文档同步 -> `apps/cli/README.md`、`docs/local-adoption-playbook.md`、`docs/local-adoption-playbook.zh-CN.md`
4. 已完成：task ledger sync
