# Code Review: working-tree-20260420-1238

- Status: verified
- Date: 2026-04-20
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: sprint delegated review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`

## 1. Review Scope

1. `apps/cli/src/runtime/cli-acp-host-protocol.ts`
2. `apps/cli/src/runtime/cli-acp-capability-discovery-runtime.ts`
3. `apps/cli/src/runtime/cli-acp-transport-client-runtime.ts`
4. `apps/cli/src/runtime/cli-acp-session-runtime.ts`
5. `apps/cli/src/runtime/cli-acp-prompt-turn-runtime.ts`
6. `apps/cli/src/runtime/cli-acp-host-operation-runtime.ts`
7. `apps/cli/src/runtime/cli-acp-execution-state-store.ts`
8. `apps/cli/src/types/interfaces/cli-acp-host-runtime.interface.ts`
9. `apps/cli/test/runtime/cli-acp-session-runtime.test.ts`
10. `.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-001-contract-and-runtime-decomposition/**`

## 2. Findings

### 2.1 [P1] shared invocation store stops being shared after the second lookup

- 位置: `apps/cli/src/runtime/cli-acp-execution-state-store.ts:34`
- 问题描述: `ensureInvocationState()` 在命中现有 row 时复制并替换 map entry，破坏了 shared mutable row 的对象别名稳定性。
- 影响: 后续 sprint-002 真实接入 shared invocation turn execution 时，`invokeResultPromise`、`acpSessionId`、permission ids 或 terminal ids 可能写回到过期引用，导致 shared-turn baseline 失真。
- 处理结论: **接受**。这会直接削弱 sprint-001 对 sprint-002 的 handoff 安全性，必须在当前窗口修复。

### 2.2 [P2] session runtime test misses the shared-state aliasing contract

- 位置: `apps/cli/test/runtime/cli-acp-session-runtime.test.ts:5`
- 问题描述: 当前测试只验证 key/default field 一致，不验证 shared-state aliasing 与 mutation visibility。
- 影响: shared invocation regression 可以在 targeted test 仍然为绿的情况下滑过，导致 baseline handoff 缺乏自动化防线。
- 处理结论: **接受**。需要在同窗口补齐 invoke-first / stream-first 的 aliasing regression coverage。

## 3. Notes

1. 治理面未发现阻塞问题；本轮 accepted findings 全部落在 `CliAcpExecutionStateStore` 与其配套测试。
2. triage 结论是先在 sprint-001 内收敛 shared-state aliasing，再继续后续 CR resolve，不把这笔 contract debt 带入 sprint-002。

## 4. Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
4. `node ./scripts/governance/check-code-review-status-sync.js`（通过）

## 5. 复核结论（2026-04-20）

1. 复核确认当前 round 有 2 条有效 findings，且都直接影响 sprint-001 对 shared invocation baseline 的 handoff 可信度。
2. `2.1` 已接受并要求在 `CliAcpExecutionStateStore` 中保持 stable shared row reference，不允许 repeated ensure 把 canonical row 替换成新对象。
3. `2.2` 已接受并要求在 `cli-acp-session-runtime.test.ts` 中补足 invoke-first / stream-first 顺序下的 mutation visibility assertions。
