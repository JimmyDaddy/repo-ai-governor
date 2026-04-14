# Code Review: sprint-001 acp host-facing transport rollout clean recheck

- Status: resolved
- Date: 2026-04-15
- Reviewer: AI-Agent
- Task: `CR-006`
- Review Type: working tree review
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
  - `.codex/skills/workspace-code-review-workflow/SKILL.md`

## 1. Review Scope
1. `apps/cli/src/runtime/cli-acp-host-protocol.ts`
2. `apps/cli/src/runtime/adapter-routing-runtime.ts`
3. `apps/cli/src/cli-governance-runtime.ts`
4. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
5. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
6. `apps/cli/src/runtime/agent-projection-runtime.ts`
7. `apps/cli/src/runtime/local-model-probe-runtime.ts`
8. `apps/cli/src/runtime/session-main-provider-continuation-runtime.ts`
9. `apps/cli/test/runtime/adapter-routing-runtime.test.ts`
10. `apps/cli/test/runtime/adapter-verification-runtime.test.ts`
11. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
12. `apps/cli/test/runtime/agent-projection-runtime.test.ts`
13. `apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts`
14. `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
15. `packages/config/test/config.unit.test.ts`
16. `packages/core-agent-projection/src/agent-projection-service.ts`
17. `packages/core-agent-projection/test/agent-projection-service.unit.test.ts`

## 2. Findings
### 2.1 [P2] ACP fail-closed preflight bypassed continuation cleanup
- 位置: `apps/cli/src/runtime/session-main-supervisor-runtime.ts:913`
- 问题描述: `acp_exec` surface 在 supervisor preflight 中会先被 probe 标记为 `UNAVAILABLE` 并被过滤掉，因此之前补在 `SessionMainProviderContinuationRuntime.prepareRequest()` 里的 stale-slot cleanup 在真实 direct-answer 控制流里根本走不到。
- 影响: lane 从 `remote_api / cli_exec` 切到 fail-closed `acp_exec` 时，旧的 provider continuation slot 仍可能残留在 session state 中，后续 turn 可能继续暴露或复用错误 transport 的 handle。
- 建议: 在 direct-answer preflight 把 selected surface 排除出候选集之前，先尝试为该 surface 解析 preflight continuation invalidation，并补一条 supervisor-level regression 锁定 `remote_api -> acp_exec` 的 guard path。

## 3. Notes
1. 本轮 findings 来自 fresh reviewer round 6；main agent 已复核并接受该 finding。
2. reviewer 未在 scoped surface 中发现第二条 actionable issue。
3. 本文件只记录 round-6 finding 修复与验证结果；sprint closeout 仍取决于下一轮 fresh reviewer 是否 clean。

## 4. Verification
1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts packages/config/test/config.unit.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 复核结论（2026-04-15）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`acp_exec` selected surface 会在 preflight probe 中被 fail-closed 排除，导致 helper 层的 cleanup 分支没有机会执行；真实 direct-answer 控制流因此仍可能保留旧 continuation slot。
   - 处理：已接受，改为在 direct-answer preflight 结束后、正式 guard/fallback 之前就尝试解析 selected surface 的 continuation invalidation，并补上 supervisor-level regression 验证 `remote_api -> acp_exec` guard path 下的 stale-slot cleanup。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts packages/config/test/config.unit.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-15）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/session-main-supervisor-runtime.ts`、`apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts packages/config/test/config.unit.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
   - 说明：supervisor 现在会在 direct-answer preflight 把 selected surface 判定为不合格后，先尝试回收该 surface 对应 lane 的 stale continuation truth；新增 supervisor regression 覆盖 `remote_api -> acp_exec` 的 fail-closed guard path。

## 处置结果与剩余风险（2026-04-15）

1. 当前 round 的 accepted finding 已全部修复，并通过同窗 focused suites、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 重验。
2. `CR-006` 已达到 `resolved` 条件，但 sprint closeout 仍需新的 fresh reviewer round 返回 clean 结论后才能继续推进。
