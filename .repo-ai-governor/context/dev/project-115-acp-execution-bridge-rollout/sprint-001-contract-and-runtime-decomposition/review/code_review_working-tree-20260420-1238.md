# Code Review: working-tree-20260420-1238

- Status: review_pending
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
- 问题描述: `ensureInvocationState()` 在命中现有 row 时重新展开 `existingState` 并替换 map entry，而不是保持同一条 mutable shared object。后续只要 invoke / stream 都碰到同一个 invocation key，就可能出现“第一份引用写入的新值没有回到 canonical row”的情况。
- 影响: 这会让 sprint-002 要依赖的 shared invocation baseline 变得不可靠，重新引入 double execution、cleanup 丢失或 future `invokeResultPromise` / `acpSessionId` 等状态写回不一致的风险。
- 建议: 保持同一个 invocation row 对象引用稳定，或把所有 mutation 收敛进 store API；同时补一条明确验证 repeated ensure 之后 mutation visibility 的回归测试。

### 2.2 [P2] session runtime test misses the shared-state aliasing contract

- 位置: `apps/cli/test/runtime/cli-acp-session-runtime.test.ts:5`
- 问题描述: 新增测试只断言 key/default fields 一致，没有证明 repeated `ensureInvocationState()` 返回的是同一条 mutable shared row，也没有覆盖第二次 ensure 之后的 mutation visibility。
- 影响: 即使 shared-state aliasing 退化，当前 targeted test 依然会保持绿色，导致 sprint-001 的 handoff contract 缺少自动化保护。
- 建议: 至少补 invoke-first 与 stream-first 两个顺序下的 aliasing/mutation assertions，直接锁住共享状态语义。

## 3. Notes

1. 本轮 reviewer 未发现 task-ledger、checklist、sprint plan 或 review lifecycle 的治理漂移问题。
2. 当前 ACP 行为仍保持 fail-closed；本轮 findings 只针对后续 sprint-002 要依赖的 shared invocation baseline，不涉及把 `acp_exec` 提前变成 executable path。

## 4. Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/cli-acp-session-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
4. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
