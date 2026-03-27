# Code Review: working tree 2026-03-27 19:35

- Status: resolved
- Date: 2026-03-27
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/contracts/memory-context-assembly-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/adrs/working-memory-and-canonical-source-boundary.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-technical-solution-registry/contracts/technical-solution-delivery-registry-contract.md`

## 1. Review Scope
1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/completed-streams-history.md`
3. `.repo-ai-governor/context/dev/project-022-memory-semantics-safety-and-consumer-hardening/plan.md`
4. `.repo-ai-governor/context/dev/project-022-memory-semantics-safety-and-consumer-hardening/sprint-002-policy-tuning-and-surface-expansion/**`
5. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
6. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
7. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
8. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/**`
9. `apps/cli/src/**`
10. `apps/cli/test/**`
11. `packages/core-memory-semantics/src/**`
12. `packages/core-memory-semantics/test/memory-semantics.unit.test.ts`
13. `packages/reporting/src/types/interfaces/reporting.interface.ts`
14. `packages/reporting/test/report-builder.unit.test.ts`

## 2. Findings
### 2.1 [P2] Sprint verification records still prescribe `pnpm run check`
- 位置: `.repo-ai-governor/context/dev/project-022-memory-semantics-safety-and-consumer-hardening/sprint-002-policy-tuning-and-surface-expansion/tasks/TK-261-sensitivity-visibility-policy-stratification-and-runtime-safe-decision-baseline.md:48`, `.repo-ai-governor/context/dev/project-022-memory-semantics-safety-and-consumer-hardening/sprint-002-policy-tuning-and-surface-expansion/tasks/TK-262-adopter-facing-promotion-output-surface-expansion-and-replay-ux-polish.md:48`, `.repo-ai-governor/context/dev/project-022-memory-semantics-safety-and-consumer-hardening/sprint-002-policy-tuning-and-surface-expansion/tasks/TK-263-workspace-user-seam-readiness-assessment-and-implementation-decision-baseline.md:48`, `.repo-ai-governor/context/dev/project-022-memory-semantics-safety-and-consumer-hardening/sprint-002-policy-tuning-and-surface-expansion/tasks/TK-264-sprint-002-exit-acceptance-and-sprint-003-input-constraints.md:52`, `.repo-ai-governor/context/dev/project-022-memory-semantics-safety-and-consumer-hardening/sprint-002-policy-tuning-and-surface-expansion/tasks/tasks.csv:10`, `.repo-ai-governor/context/dev/project-022-memory-semantics-safety-and-consumer-hardening/sprint-002-policy-tuning-and-surface-expansion/review/resolved_code_review_tk-261-tk-264-sprint-002-policy-and-surface-expansion.md:38`
- 问题描述: 仓库标准明确要求“Do not use `pnpm run check` in verification commands to avoid recursive gate execution.”，但本轮新建的 task card、`tasks.csv` 完成记录以及已收口的 CR 仍把 `pnpm run check` 记作验证命令。这个模式会把聚合总门传播成台账标准答案，后续 AI/人工执行会继续抄用非定向、递归风险更高的命令。
- 影响: 当前代码本身已通过定向校验，但治理证据面与仓库标准冲突；后续收尾、复核或审计若以这些记录为依据，会持续偏离“只记录确定性、可定位的验证命令”的要求。
- 建议: 把这些位置的 `pnpm run check` 改成与本次改动直接对应的定向命令组合，并同步更新已生成的 resolved CR 验证区，避免后续流程继续复制该模式。

## 3. Notes
1. 我没有在本轮代码路径里发现新的 runtime correctness / contract drift 问题；发现集中在治理记录与验证命令约束不一致。
2. `memory policy` 分层、runtime-safe stage input、adopter-facing replay/reporting surface 的代码与定向测试链路当前表现一致。

## 4. Verification
1. `/opt/homebrew/bin/node ./scripts/governance/check-task-ledger-sync.js`（通过）
2. `/opt/homebrew/bin/node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
3. `/opt/homebrew/bin/node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）
4. `/opt/homebrew/bin/node ./scripts/governance/check-technical-solution-module-graph.js`（通过）
5. `/opt/homebrew/bin/node ./scripts/governance/run-normative-loading-manifest-gate.js`（通过）
6. `/opt/homebrew/bin/node ./scripts/governance/check-code-review-status-sync.js`（通过）
7. `PATH="/opt/homebrew/bin:/Users/jimmydaddy/Library/pnpm:$PATH" /Users/jimmydaddy/Library/pnpm/pnpm -s tsc -p tsconfig.json --noEmit`（通过）
8. `PATH="/opt/homebrew/bin:/Users/jimmydaddy/Library/pnpm:$PATH" /Users/jimmydaddy/Library/pnpm/pnpm exec vitest run packages/core-memory-semantics/test/memory-semantics.unit.test.ts apps/cli/test/runtime/task-driven-run-runtime.test.ts apps/cli/test/runtime/replay-explain-builder.test.ts apps/cli/test/runtime/command-experience-builder.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts packages/reporting/test/report-builder.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 复核结论（2026-03-27）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`TK-261`、`TK-262`、`TK-263`、`TK-264` 的 `Delivery Verification` 已移除 `pnpm run check`，改为定向的 `run-normative-loading-manifest-gate` 或 `check-artifact-registry-lifecycle`；`tasks.csv` 的完成记录同步改为对应的定向验证链；已收口的 `resolved_code_review_tk-261-tk-264-sprint-002-policy-and-surface-expansion.md` 也改成定向 gate。
   - 处理：按 finding 建议完成修复，并将验证命令从聚合总门收敛为与本次改动直接对应的定向命令组合。

### 验证命令
1. `/opt/homebrew/bin/node ./scripts/governance/check-task-ledger-sync.js`（通过）
2. `/opt/homebrew/bin/node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
3. `/opt/homebrew/bin/node ./scripts/governance/check-code-review-status-sync.js`（通过）
4. `/opt/homebrew/bin/node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
5. `/opt/homebrew/bin/node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）
6. `/opt/homebrew/bin/node ./scripts/governance/run-normative-loading-manifest-gate.js`（通过）

## 修复执行记录（2026-03-27）

1. `2.1`：已完成
   - 变更文件：`.repo-ai-governor/context/dev/project-022-memory-semantics-safety-and-consumer-hardening/sprint-002-policy-tuning-and-surface-expansion/tasks/TK-261-sensitivity-visibility-policy-stratification-and-runtime-safe-decision-baseline.md`、`.repo-ai-governor/context/dev/project-022-memory-semantics-safety-and-consumer-hardening/sprint-002-policy-tuning-and-surface-expansion/tasks/TK-262-adopter-facing-promotion-output-surface-expansion-and-replay-ux-polish.md`、`.repo-ai-governor/context/dev/project-022-memory-semantics-safety-and-consumer-hardening/sprint-002-policy-tuning-and-surface-expansion/tasks/TK-263-workspace-user-seam-readiness-assessment-and-implementation-decision-baseline.md`、`.repo-ai-governor/context/dev/project-022-memory-semantics-safety-and-consumer-hardening/sprint-002-policy-tuning-and-surface-expansion/tasks/TK-264-sprint-002-exit-acceptance-and-sprint-003-input-constraints.md`、`.repo-ai-governor/context/dev/project-022-memory-semantics-safety-and-consumer-hardening/sprint-002-policy-tuning-and-surface-expansion/tasks/tasks.csv`、`.repo-ai-governor/context/dev/project-022-memory-semantics-safety-and-consumer-hardening/sprint-002-policy-tuning-and-surface-expansion/review/resolved_code_review_tk-261-tk-264-sprint-002-policy-and-surface-expansion.md`
   - 验证：`node ./scripts/governance/check-task-ledger-sync.js && node ./scripts/governance/check-sprint-plan-status-sync.js && node ./scripts/governance/check-code-review-status-sync.js && node ./scripts/governance/check-artifact-registry-lifecycle.js && node ./scripts/governance/check-technical-solution-delivery-registry.js && node ./scripts/governance/run-normative-loading-manifest-gate.js && pnpm run check`（通过）
   - 说明：将 sprint-002 台账、task card 与 CR 中的聚合总门替换为定向验证命令，避免后续继续传播递归 gate 模式。
