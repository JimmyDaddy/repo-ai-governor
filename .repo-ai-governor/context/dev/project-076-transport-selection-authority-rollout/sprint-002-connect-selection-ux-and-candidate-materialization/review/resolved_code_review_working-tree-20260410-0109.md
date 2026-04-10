# Code Review: sprint-002-connect-selection-ux-and-candidate-materialization post-fix recheck

- Status: resolved
- Date: 2026-04-10
- Reviewer: AI-Agent
- Task: `CR-002`
- Review Type: post-fix recheck
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope

1. `apps/cli/src/main.ts`
2. `apps/cli/src/commands/connect-command.ts`
3. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
4. `apps/cli/src/runtime/agent-projection-runtime.ts`
5. `apps/cli/src/runtime/session-main-provider-continuation-runtime.ts`
6. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
7. `apps/cli/test/runtime/agent-projection-runtime.test.ts`
8. `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
9. `apps/cli/test/connect-phase2.integration.test.ts`
10. `apps/cli/test/commands/connect-command.test.ts`
11. `packages/config/src/schema-validator.ts`
12. `packages/config/test/config.unit.test.ts`

## 2. Findings

### 2.1 [P1] Explicit `cli_exec` candidate rows still failed schema validation when `remoteApi` remained configured
- 位置: `apps/cli/src/runtime/agent-onboarding-runtime.ts:713`；`packages/config/src/schema-validator.ts:1156`
- 问题描述: `connect --tool-transport codex=cli_exec` 会把 selected transport materialize 为 `cli_exec`，同时按 contract 保留 `remoteApi` 作为 configured truth；但 `SchemaValidator` 仍把 `remoteApi + transport !== remote_api` 判为非法，导致 candidate config 能生成却不能在后续 load/apply 中稳定通过校验。
- 影响: sprint-002 新增的 explicit transport authoring 路径在 `cli_exec` override 场景下不是端到端可用能力，用户可能在 `generate` 成功后被 `apply` 或后续配置加载阻断。
- 建议: 允许 transport-aware tool row 在显式选择 `cli_exec` 时继续保留 `remoteApi` 作为未选中的 configured truth，并补上覆盖 `connect generate -> apply` 的回归验证。

## 3. Notes

1. `CR-002` 的初始 fallback clean 判断已被 delayed delegated reviewer 结果推翻；本文件现以迟到但有效的 reviewer finding 为准完成真实修复闭环。
2. 本轮 resolved 仅表示该 actionable finding 已完成修复与复验；sprint-002 的 clean closeout 仍需下一轮 fresh delegated reviewer recheck 才能成立。

## 复核结论（2026-04-10）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`CliAgentOnboardingRuntime.buildCandidateToolConfig(...)` 在显式 `transport=cli_exec` 时保留了 `remoteApi` nested truth，而 `SchemaValidator` 仍要求“只要配置了 `remoteApi`，transport 必须是 `remote_api`”，两者语义冲突。
   - 处理：调整 schema validator，使显式 selected transport 与未选中的 `configured_remote_api` 可以并存，并补充能覆盖 `generate -> apply` 闭环的回归测试。

### 验证命令
1. `pnpm run build`（通过）
2. `pnpm exec vitest run packages/config/test/config.unit.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/connect-phase2.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/commands/connect-command.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 4. Verification

1. `pnpm run build`（通过）
2. `pnpm exec vitest run packages/config/test/config.unit.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/connect-phase2.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/commands/connect-command.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-10）

1. `2.1`：已完成
   - 变更文件：`packages/config/src/schema-validator.ts`、`packages/config/test/config.unit.test.ts`、`apps/cli/test/connect-phase2.integration.test.ts`
   - 验证：`pnpm run build`（通过）；`pnpm exec vitest run packages/config/test/config.unit.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/connect-phase2.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/commands/connect-command.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：schema validator 现已允许显式 `cli_exec` selected transport 与 `remoteApi` configured truth 共存；新增的 integration regression 证明该 candidate 可被后续 `apply` 正常消费。

## 处置结果与剩余风险

1. 当前 round 返回的唯一 actionable finding 已完成修复并通过同窗口 build + targeted tests 复验。
2. 剩余风险不再是 schema / apply 断链，而是 sprint-002 仍需一个 fresh delegated reviewer clean round 才能声明本边界“无新的 actionable finding”。
