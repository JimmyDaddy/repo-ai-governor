# Code Review: sprint-001 acp host-facing transport rollout clean recheck

- Status: resolved
- Date: 2026-04-15
- Reviewer: AI-Agent
- Task: `CR-005`
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
14. `packages/config/test/config.unit.test.ts`
15. `packages/core-agent-projection/src/agent-projection-service.ts`
16. `packages/core-agent-projection/test/agent-projection-service.unit.test.ts`

## 2. Findings
### 2.1 [P2] ACP transport switch left stale continuation slots behind
- 位置: `apps/cli/src/runtime/session-main-provider-continuation-runtime.ts:107`
- 问题描述: `resolveTransportKind()` 在 `acp_exec` 下返回 `null` 后，`prepareRequest()` 直接退出，导致已有的 `remote_api / cli_exec` continuation slot 无法被清理；`resolveMutations()` 对 `prepared=null` 又不会发出清理 mutation。
- 影响: 同一 lane 从 continuation-capable transport 切到 `acp_exec` 后仍可能保留旧 handle，后续 turn 可能错误复用或展示不再匹配当前 transport 的 continuation truth。
- 建议: 在 `acp_exec` 等不支持 continuation 的 transport 下，如果发现同 lane 已有旧 slot，则仍要生成 pre-dispatch clear mutation，并用回归测试锁定 `remote_api/cli_exec -> acp_exec` 的 invalidation path。

## 3. Notes
1. 本轮 findings 来自 fresh reviewer round 5；main agent 已复核并接受该 finding。
2. reviewer 未在 scoped surface 中发现第二条 actionable issue。
3. 本文件只记录 round-5 finding 修复与验证结果；sprint closeout 仍取决于下一轮 fresh reviewer 是否 clean。

## 4. Verification
1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts packages/config/test/config.unit.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 复核结论（2026-04-15）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：当前实现会让 `acp_exec` lane 直接返回 `prepared=null`，从而跳过已有 continuation slot 的清理；这会把此前 `remote_api / cli_exec` 的 provider handle 残留到已经切换 transport 的 lane 上。
   - 处理：已接受，改为在不支持 continuation 的 transport 下仍查找同 lane 旧 slot，并发出 pre-dispatch clear mutation；同时补上从 continuation-capable transport 切到 `acp_exec` 的回归测试。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts packages/config/test/config.unit.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-15）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/session-main-provider-continuation-runtime.ts`、`apps/cli/src/runtime/session-main-supervisor-runtime.ts`、`apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts packages/config/test/config.unit.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
   - 说明：`acp_exec` 现在仍不会发 continuation request，但如果同 lane 已有旧 slot，会先发出 clear mutation 清掉旧 provider continuation truth，并由新增回归测试锁定该 invalidation path。

## 处置结果与剩余风险（2026-04-15）

1. 当前 round 的 accepted finding 已全部修复，并通过同窗 focused suites、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 重验。
2. `CR-005` 已达到 `resolved` 条件，但 sprint closeout 仍需新的 fresh reviewer round 返回 clean 结论后才能继续推进。
