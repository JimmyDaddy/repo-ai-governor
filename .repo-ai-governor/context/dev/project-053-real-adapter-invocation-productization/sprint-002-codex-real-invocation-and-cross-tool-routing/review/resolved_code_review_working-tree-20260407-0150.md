# Code Review: sprint-002-codex-real-invocation-and-cross-tool-routing round 1

- Status: resolved
- Date: 2026-04-07
- Reviewer: Aquinas delegated reviewer
- Task: `CR-001`
- Review Type: sprint scoped delegated review
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
13. `.repo-ai-governor/context/dev/project-053-real-adapter-invocation-productization/sprint-002-codex-real-invocation-and-cross-tool-routing/tasks/CR-001.md`

## 2. Findings

### 2.1 [P2] Dry-run playbook overstates workspace non-mutation

- 位置: `docs/local-adoption-playbook.md`, `docs/local-adoption-playbook.zh-CN.md`
- 问题描述: 当前 playbook 将 `run --dry-run --trace` 描述成“不会改动 workspace”，但真实路径仍会在 active governor workspace 下持久化 report、replay 与 trace 等审计 artifacts。它不会改动 governed repo 文件或依赖状态，但并非严格零写入。
- 影响: adopter 可能把 dry-run 误判成完全不触达磁盘的模式，进而在受限环境、临时目录或证据保留要求下做出错误预期。
- 建议: 将文档收紧为“不会修改 governed repo 内容，也不会做依赖/交付副作用，但会在 active governor workspace 中写入审计 artifacts”，与真实 CLI 行为保持一致。

## 3. Notes

1. 当前 real-path evidence 已覆盖 `codex` primary route 的 traced dry-run success，但尚未证明非 `codex` fallback surface 的 dry-run parity；本轮将其保留为 residual note，而不提升为 blocking finding。
2. reviewer 还标记了 `buildCandidateAdaptersConfig()` 的 `localModel` preservation branch 缺少直接 coverage；主 agent 将在 repair window 中补充该测试，避免让该 note 悬空进入 sprint closeout。

## 4. Verification

1. `pnpm vitest run packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts apps/cli/test/runtime/task-driven-run-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts test/first-batch-adapters-route.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm vitest run apps/cli/test/cli-governance-runtime.integration.test.ts -t "aligns adapter invoke timeout with the run-stage timeout budget for baseline prepare stages" --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run build`（通过）
4. `node ./dist/bin/repo-ai-governor.js --output json --adapters verify`（通过；`adapters_status=warn`，但 `required_role_failures=0`，`planner/architect/coder/reviewer/verifier` 均选择 `codex + cli_exec`）
5. `node ./dist/bin/repo-ai-governor.js --output json --adapters --dry-run --trace run`（通过；`runtime_status=succeeded`，`prepare/execute/report` 全部成功）

## 复核结论（2026-04-07）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：`.tmp/project-053-sprint-002-run-dry-run-trace.json` 证明 `run --dry-run --trace` 成功执行并在 active governor workspace 中产出 report、replay、trace 等 artifacts；因此“不会修改 governed repo 内容”成立，但“不会改动 workspace”过宽。
   - 处理：收紧中英 playbook 文案，明确 dry-run 只避免 governed repo 文件变更、依赖/交付副作用，审计 artifacts 仍会写入 active governor workspace。

## 风险与后续

1. 非 `codex` fallback surface 的 traced dry-run parity 仍缺少同窗口真实证据；由于本 sprint 的 acceptance boundary 是默认 `codex` primary route，先保留为 residual note，不升级为 blocking finding。
2. reviewer 提到的 `localModel` preservation coverage gap 已在同窗口补入 `OLLAMA` 直测，不再保留为未决 finding。

## 验证命令

1. `pnpm vitest run packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts apps/cli/test/runtime/task-driven-run-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts test/first-batch-adapters-route.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm vitest run apps/cli/test/cli-governance-runtime.integration.test.ts -t "aligns adapter invoke timeout with the run-stage timeout budget for baseline prepare stages" --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run build`（通过）
4. `node ./dist/bin/repo-ai-governor.js --output json --adapters verify`（通过）
5. `node ./dist/bin/repo-ai-governor.js --output json --adapters --dry-run --trace run`（通过）

## 修复执行记录（2026-04-07）

1. `2.1`：已完成
   - 变更文件：`docs/local-adoption-playbook.md`、`docs/local-adoption-playbook.zh-CN.md`
   - 验证：`pnpm vitest run packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts apps/cli/test/runtime/task-driven-run-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts test/first-batch-adapters-route.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm vitest run apps/cli/test/cli-governance-runtime.integration.test.ts -t "aligns adapter invoke timeout with the run-stage timeout budget for baseline prepare stages" --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`node ./dist/bin/repo-ai-governor.js --output json --adapters verify`、`node ./dist/bin/repo-ai-governor.js --output json --adapters --dry-run --trace run`（均通过）
   - 说明：中英 playbook 已明确 dry-run 不会改动 governed repo 或依赖/交付状态，但仍会在 active governor workspace 中保留 audit artifacts，避免把“读写受限”误写成“绝对零写入”。
2. `review note / localModel coverage`：已完成补强
   - 变更文件：`apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
   - 验证：`pnpm vitest run packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts apps/cli/test/runtime/task-driven-run-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts test/first-batch-adapters-route.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：补入 `OLLAMA` 场景的 direct preservation test，确保 `buildCandidateAdaptersConfig()` 对 `localModel` truth 的传递具备直接 coverage。

## 处置结果与剩余风险（2026-04-07）

1. 本轮唯一 accepted finding 已修复并完成同窗口验证。
2. `localModel` preservation coverage note 已在同窗口补强，不再保留为未决问题。
3. 非 `codex` fallback surface 的 traced dry-run parity 继续保留为 residual note；当前 sprint-002 acceptance boundary 已由 `codex` primary route 的 real verify + traced dry-run 证据覆盖，因此本轮不将其升级为 blocking item。
