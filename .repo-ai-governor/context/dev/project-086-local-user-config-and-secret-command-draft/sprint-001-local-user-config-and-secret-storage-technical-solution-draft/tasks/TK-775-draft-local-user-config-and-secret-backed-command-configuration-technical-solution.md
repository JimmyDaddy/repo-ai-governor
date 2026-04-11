# TK-775 draft local user config and secret-backed command configuration technical solution

- Status: completed
- Date: 2026-04-11
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-086-local-user-config-and-secret-command-draft`
- Sprint: `sprint-001-local-user-config-and-secret-storage-technical-solution-draft`

## 1. 任务目标

沉淀一份新的技术草案，回答“能否有隐藏用户配置文件，并通过命令设置 apikey / 模式等私有默认值”，同时给出与互联网成熟方案对比后的推荐架构。

## 2. Depends On

1. `technical-solution.api-key-remote-adapter-invocation`
2. `apps/cli/src/runtime/global-cli-theme-preference-service.ts`
3. `packages/config/src/workspace-resolver.ts`

## 3. 预期产物

1. 一份新的 technical solution draft，落在 `.repo-ai-governor/draft/`
2. 一条新的 lifecycle registry draft entry
3. 可供后续实现 sprint 直接消费的方案比较、推荐与 phased rollout

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
4. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
5. `.repo-ai-governor/draft/api-key-remote-adapter-invocation-technical-solution.md`

## 5. Traceback References

1. `apps/cli/src/runtime/global-cli-theme-preference-service.ts`
2. `apps/cli/src/main.ts`
3. `packages/adapters/codex/src/codex-agent-adapter.ts`
4. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`

## 6. 实施计划

1. 复盘当前仓库已经存在的 workspace/config/theme-preference/credentialRef seams。
2. 结合 AWS CLI、npm、Docker、GitHub CLI、Git credential helper 等官方做法，对比单文件、双文件、OS keychain/helper 三类方案。
3. 输出推荐方案、命令契约、优先级规则、安全边界与 phased rollout，并登记 lifecycle draft entry。

## 7. Development Verification

1. docs/source cross-check：current config/runtime seams + official reference links
2. `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --task-id TK-775 --tasks-dir ".repo-ai-governor/context/dev/project-086-local-user-config-and-secret-command-draft/sprint-001-local-user-config-and-secret-storage-technical-solution-draft/tasks"`
2. `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
5. docs-only drafting；未修改 `apps/**`、`packages/**`、`bin/**`、`test/**` 可执行代码，因此 `pnpm run build` not required

## 9. 执行记录

1. 2026-04-11：任务创建并直接进入 `in_progress`，范围锁定为 docs-only 技术草案沉淀与 lifecycle draft 登记。
2. 2026-04-11：复盘了当前仓库已有的 `governor.yaml` / workspace resolver / `cli-preferences.yaml` / `credentialRef` seams，确认当前缺口不在 schema，而在用户级本地默认值层与 secret backend。
3. 2026-04-11：结合 AWS CLI、npm、Docker、GitHub CLI 与 Git credential helper 的官方做法，整理出单文件、双文件、OS keychain/helper 三类方案的优缺点。
4. 2026-04-11：已产出新的 technical solution draft，并在 lifecycle registry 中登记为 `draft`，供后续 review / promotion 直接消费。
5. 2026-04-11：执行 lifecycle gate 验证通过；本任务完成。

## 10. 产出

1. 已完成：technical solution draft -> `.repo-ai-governor/draft/local-user-config-and-secret-backed-command-configuration-technical-solution.md`
2. 已完成：lifecycle registry draft entry -> `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
3. 已完成：task ledger sync
