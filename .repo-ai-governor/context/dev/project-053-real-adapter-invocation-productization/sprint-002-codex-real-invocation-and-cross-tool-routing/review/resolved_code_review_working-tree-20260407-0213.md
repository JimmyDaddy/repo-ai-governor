# Code Review: sprint-002-codex-real-invocation-and-cross-tool-routing round 2

- Status: resolved
- Date: 2026-04-07
- Reviewer: Schrodinger delegated reviewer, verified by AI-Agent
- Task: `CR-002`
- Review Type: sprint scoped delegated post-fix recheck
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

1. `apps/cli/src/runtime/task-driven-run-runtime.ts`
2. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
3. `apps/cli/src/cli-governance-runtime.ts`
4. `packages/adapters/codex/src/codex-agent-adapter.ts`
5. `apps/cli/test/runtime/task-driven-run-runtime.test.ts`
6. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
7. `apps/cli/test/cli-governance-runtime.integration.test.ts`
8. `packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`
9. `docs/support-matrix.md`
10. `docs/support-matrix.zh-CN.md`
11. `docs/local-adoption-playbook.md`
12. `docs/local-adoption-playbook.zh-CN.md`
13. `.repo-ai-governor/context/dev/project-053-real-adapter-invocation-productization/sprint-002-codex-real-invocation-and-cross-tool-routing/tasks/CR-002.md`

## 2. Findings

未发现需要修复的 actionable finding。

## 3. Notes

1. 风险推断层面，当前窗口仍缺少非 `codex` fallback surface 在非 execute stage 上的 same-window traced dry-run evidence；由于本 sprint 的 acceptance boundary 仍是 `codex` primary route，这一项继续保留为 residual parity note，不升级为 blocking finding。
2. `node ./dist/bin/repo-ai-governor.js --output json --adapters verify` 仍返回 `warn`，但 warn 全部来自 tool-managed workspace 初始化真值（`durable-storage`、`artifact-registry`、`task-ledger`），`required_role_failures=0`，因此不构成本轮阻塞。
3. `pnpm run check` 在同窗口首先暴露了 `apps/cli/test/runtime/task-driven-run-runtime.test.ts` 与 `apps/cli/test/cli-governance-runtime.integration.test.ts` 的 formatter-only drift；主 agent 运行 `pnpm exec biome format --write` 后 gate 通过。该归一化不改变测试语义，因此不单独提升为新的 review finding。

## 4. Verification

1. `pnpm vitest run packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts apps/cli/test/runtime/task-driven-run-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts test/first-batch-adapters-route.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm vitest run apps/cli/test/cli-governance-runtime.integration.test.ts -t "aligns adapter invoke timeout with the run-stage timeout budget for baseline prepare stages" --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run build`（通过）
4. `node ./dist/bin/repo-ai-governor.js --output json --adapters verify`（通过；`adapters_status=warn`，`required_role_failures=0`）
5. `node ./dist/bin/repo-ai-governor.js --output json --adapters --dry-run --trace run`（通过；`runtime_status=succeeded`）
6. `pnpm exec biome format --write apps/cli/test/runtime/task-driven-run-runtime.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts`（通过）
7. `pnpm run check`（通过）

## 复核结论（2026-04-07）

- 整体结论：**clean**
- 说明：fresh reviewer round 2 未发现当前 sprint review surface 内的 actionable finding；同窗口 formatter-only drift 已归一化，`CR-002` 可直接收口为 `resolved`。

## 处置结果与剩余风险（2026-04-07）

1. round 2 clean 收口，无 accepted / deferred finding。
2. 非 `codex` fallback surface 的 traced dry-run parity 继续保留为 residual note，等待后续更宽的 adapter rollout 边界统一补证。
3. `verify --adapters` 的 `warn` 仍是预期的 tool-managed workspace 初始化真值，不影响 sprint-002 的 closeout 判断。
