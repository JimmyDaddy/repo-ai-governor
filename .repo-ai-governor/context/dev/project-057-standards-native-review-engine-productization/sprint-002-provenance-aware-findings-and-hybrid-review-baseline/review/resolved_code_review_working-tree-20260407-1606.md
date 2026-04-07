# Code Review: sprint-002-provenance-aware-findings-and-hybrid-review-baseline

- Status: resolved
- Date: 2026-04-07
- Reviewer: reviewer sub-agent (`gpt-5.4`, `xhigh`)
- Task: `CR-001`
- Review Type: sprint scope review
- Scope Kind: `sprint`
- Scope Label: `sprint-002-provenance-aware-findings-and-hybrid-review-baseline`
- Report Slug: `working-tree-20260407-1606`
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope

1. `apps/cli/src/commands/review-command.ts`
2. `apps/cli/src/runtime/review/cli-hybrid-review-runtime.ts`
3. `apps/cli/src/runtime/review/cli-review-finding-generator.ts`
4. `apps/cli/src/constants/cli-review.constant.ts`
5. `apps/cli/src/types/interfaces/cli-review-command.interface.ts`
6. `apps/cli/test/commands/review-command.test.ts`
7. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-002-provenance-aware-findings-and-hybrid-review-baseline`

## 2. Findings

### 2.1 [P1] Review can resolve while applicable projected rules remain uncovered

- Location: `apps/cli/src/commands/review-command.ts`, `apps/cli/src/runtime/review/cli-hybrid-review-runtime.ts`
- Problem: `reviewStatus` was derived only from emitted finding count, so a code-affecting scope with matching test updates could still emit `resolved_code_review_*` while `hybridReviewContext.uncoveredRuleIds` retained applicable rules such as `review-rule.cs-034-build-evidence`.
- Impact: the lifecycle could claim a clean resolved artifact without recorded same-window closure for uncovered projected rules, weakening `CS-034` evidence truthfulness and the new hybrid review contract.
- Recommendation: keep the artifact in `review_pending` whenever applicable projected rules remain uncovered, and add regression coverage for the no-findings-but-uncovered path.
- Normative Basis: `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md#CS-034`

### 2.2 [P2] Filtered projected bundles retain stale aggregate source metadata

- Location: `apps/cli/src/runtime/review/cli-hybrid-review-runtime.ts`
- Problem: the runtime filtered `projectedRuleBundle.rules` to the current-scope subset but left `standardsSourceRefs` and `projectedPackRefs` copied from the full Phase A bundle.
- Impact: downstream delegated-review consumers could read irrelevant standards sources or packs and persist an inaccurate handoff/audit trail.
- Recommendation: recompute bundle-level aggregate refs from the filtered rule subset before persisting the hybrid review context.
- Normative Basis: risk-based inference on delegated handoff correctness

### 2.3 [P2] New provenance artifact strings were introduced as English-only copy

- Location: `apps/cli/src/commands/review-command.ts`
- Problem: the new provenance headings and labels passed English on both sides of `localizeText`, so `zh-CN` review artifacts would still render the new sections in English.
- Impact: the sprint widened the untranslated user-facing CLI artifact surface introduced by the provenance-aware review output.
- Recommendation: provide real Chinese translations for the new headings and field labels added by sprint-002.
- Normative Basis: `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md#CS-033`

## 3. Notes

1. Reviewer also called out a regression risk gap for the “tests updated, no deterministic findings, uncovered projected rules remain” branch.
2. Reviewer also noted there was no assertion that filtered bundle aggregate refs stay aligned with the filtered rule subset.

## 4. Verification

1. `pnpm run build` (passed before review)
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1 apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts` (passed before review)
3. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1` (passed before review)
4. `pnpm run check` (passed before review)
5. `node ./scripts/governance/check-task-ledger-sync.js` (passed before review)
6. `node ./scripts/governance/check-sprint-plan-status-sync.js` (passed before review)
7. `node ./scripts/governance/check-code-review-status-sync.js` (passed before review)
8. `node ./scripts/governance/check-worktree-review-target.js` (passed before review)
9. `node ./scripts/governance/check-technical-solution-delivery-registry.js` (passed before review)

## 复核结论（2026-04-07）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：`reviewStatus` 仅按 `findings.length` 决定会让“零 finding 但仍有 uncovered projected rules”的路径错误落到 `resolved`。
   - 处理：已接受并改为“只要仍有 uncovered projected rules 就保持 `review_pending`”，同时补充回归测试覆盖该分支。

2. `2.2`
   - 判定：**认可**
   - 证据：filtered `projectedRuleBundle.rules` 与 bundle-level `standardsSourceRefs/projectedPackRefs` 之间存在聚合元数据漂移。
   - 处理：已接受并重算 filtered subset 对应的 aggregate refs，避免 delegated handoff 读取无关来源。

3. `2.3`
   - 判定：**认可**
   - 证据：新增 provenance headings / labels 在 `localizeText()` 中仍使用英语双写，扩大了 review artifact 的未翻译 surface。
   - 处理：已接受并补齐新增 provenance artifact strings 的中文翻译。

### 验证命令

1. `pnpm run build`（通过）
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1 apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts`（通过）
3. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run check`（通过）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
7. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
8. `node ./scripts/governance/check-worktree-review-target.js`（通过）
9. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）

## 修复执行记录（2026-04-07）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/commands/review-command.ts`, `apps/cli/test/commands/review-command.test.ts`
   - 验证：`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1 apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check`
   - 说明：当 applicable projected rules 仍处于 uncovered 状态时，review artifact 现在会保持 `review_pending`，并新增回归测试覆盖“零 finding 但仍 pending”的分支。

2. `2.2`：已完成
   - 变更文件：`apps/cli/src/runtime/review/cli-hybrid-review-runtime.ts`, `apps/cli/test/commands/review-command.test.ts`
   - 验证：`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1 apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts`、`pnpm run check`
   - 说明：filtered `projectedRuleBundle` 现在会从 filtered rule subset 重新聚合 `standardsSourceRefs/projectedPackRefs`。

3. `2.3`：已完成
   - 变更文件：`apps/cli/src/commands/review-command.ts`
   - 验证：`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1 apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts`、`pnpm run check`
   - 说明：本轮新增 provenance headings / labels 已补齐中文翻译，不再继续扩大 sprint-002 引入的 review artifact 英文-only surface。

## 处置结果与剩余风险

1. 本轮 3 条 accepted findings 已全部修复并完成同窗口 build / package tests / integration tests / full check。
2. sprint-002 当前 remaining risk 主要收敛为后续 sprint-003 才会正式接入的 structured delegated reviewer handoff，而非本轮已接受缺陷。
