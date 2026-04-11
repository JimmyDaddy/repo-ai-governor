# TK-777 clarify solution-c api-key setup flow in the local-user-config technical draft

- Status: completed
- Date: 2026-04-11
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-086-local-user-config-and-secret-command-draft`
- Sprint: `sprint-002-solution-c-api-key-flow-clarification`

## 1. 任务目标

基于 draft comment，补齐“方案 C 下用户应该怎么设置 apikey”的实际操作流，明确命令示例、secret value / credentialRef / shared truth 的落盘边界，以及 `connect` / runtime 后续如何消费。

## 2. Depends On

1. `TK-775`
2. `.repo-ai-governor/draft/local-user-config-and-secret-backed-command-configuration-technical-solution.md`
3. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`

## 3. 预期产物

1. 更新后的 technical solution draft
2. 一段可直接回答 diff comment 的方案 C end-to-end 设置说明
3. 同步后的 task ledger 记录

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
4. `.repo-ai-governor/draft/local-user-config-and-secret-backed-command-configuration-technical-solution.md`
5. `.repo-ai-governor/context/dev/project-086-local-user-config-and-secret-command-draft/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/local-user-config-and-secret-backed-command-configuration-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-086-local-user-config-and-secret-command-draft/sprint-001-local-user-config-and-secret-storage-technical-solution-draft/tasks/TK-775-draft-local-user-config-and-secret-backed-command-configuration-technical-solution.md`

## 6. 实施计划

1. 复核当前 draft 中已有的 `config` / `secret` 命令契约与 `credentialRef` 语义。
2. 增补方案 C 下的实际用户路径，包括 `secret set/import`、`config set credentialRef`、`connect`/runtime consume。
3. 明确 secret value、用户默认值层与共享治理层三者的落盘边界，避免用户把 apikey 与 `governor.yaml` 混淆。

## 7. Development Verification

1. docs/source cross-check：draft commands、storage boundary、runtime precedence narrative 一致
2. `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --task-id TK-777 --tasks-dir ".repo-ai-governor/context/dev/project-086-local-user-config-and-secret-command-draft/sprint-002-solution-c-api-key-flow-clarification/tasks"`
2. `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
5. docs-only clarification；未修改 `apps/**`、`packages/**`、`bin/**`、`test/**` 可执行代码，因此 `pnpm run build` not required

## 9. 执行记录

1. 2026-04-11：任务创建并直接进入 `in_progress`，范围锁定为方案 C 用户操作流澄清，不新增实现承诺。
2. 2026-04-11：确认 draft 已有 `secret set/import` 与 `config set credentialRef` 的契约碎片，缺的是把它们串成“用户如何设置 apikey”的实际说明。
3. 2026-04-11：已补齐 end-to-end 命令示例、secret value / selector / shared truth 的落盘边界，以及 `credentialRef` 的运行时消费叙事。
4. 2026-04-11：lifecycle gate 与 ledger/status gate 验证通过；本任务完成。

## 10. 产出

1. 已完成：draft clarification -> `.repo-ai-governor/draft/local-user-config-and-secret-backed-command-configuration-technical-solution.md`
2. 已完成：task ledger sync
