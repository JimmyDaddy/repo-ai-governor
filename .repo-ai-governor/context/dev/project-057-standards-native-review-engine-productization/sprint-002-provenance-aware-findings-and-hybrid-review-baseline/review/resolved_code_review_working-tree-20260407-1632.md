# Code Review: sprint-002-provenance-aware-findings-and-hybrid-review-baseline

- Status: resolved
- Date: 2026-04-07
- Reviewer: reviewer sub-agent (`gpt-5.4`, `xhigh`)
- Task: `CR-002`
- Review Type: sprint scope review
- Scope Kind: `sprint`
- Scope Label: `sprint-002-provenance-aware-findings-and-hybrid-review-baseline`
- Report Slug: `working-tree-20260407-1632`
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
6. `apps/cli/src/types/interfaces/index.ts`
7. `apps/cli/test/commands/review-command.test.ts`
8. `apps/cli/package.json`
9. `.codex/skills/technical-solution-review/SKILL.md`
10. `.codex/skills/technical-solution-review/agents/openai.yaml`
11. `AGENTS.md`
12. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-002-provenance-aware-findings-and-hybrid-review-baseline`

## 2. Findings

### 2.1 [P1] Zero-finding reviews are still opened as pending

- Location: `apps/cli/src/commands/review-command.ts`, `apps/cli/test/commands/review-command.test.ts`
- Problem: the new lifecycle branch kept `review_pending` whenever uncovered projected rules remained, even if no review finding was emitted.
- Impact: `review` could persist a pending artifact with no finding to disposition, which conflicts with the repo review lifecycle contract and diverges from `review-verify`, where zero source findings resolve immediately.
- Recommendation: resolve zero-finding reviews at generation time, and record uncovered projected rules as follow-up notes instead of holding the lifecycle markdown artifact open.
- Normative Basis: `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md#CS-026`, `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`

### 2.2 [P2] CS-033 applicability over-matches internal app/package edits

- Location: `apps/cli/src/runtime/review/cli-hybrid-review-runtime.ts`, `apps/cli/test/commands/review-command.test.ts`
- Problem: `USER_FACING_TEXT_CHANGE` treated any `apps/**` or `packages/**` edit as applicable, even when the changed file did not own user-facing copy.
- Impact: internal-only source edits could keep `review-rule.cs-033-user-facing-i18n` uncovered, creating noisy follow-up pressure and weakening the signal quality of standards-guided review coverage.
- Recommendation: narrow the applicability heuristic to files that are more likely to own user-facing text, and add regression coverage for both internal-only and user-facing source paths.
- Normative Basis: risk-based inference on rule applicability precision for `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md#CS-033`

## 3. Notes

1. Reviewer did not identify actionable issues in `AGENTS.md` or `.codex/skills/technical-solution-review/SKILL.md`.
2. Reviewer noted that `pnpm run check`, `pnpm run test:integration`, and sprint governance checks still needed rerun after fixes if lifecycle behavior changed.

## 4. Verification

1. `pnpm run build` (passed before review)
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1 apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts` (passed before review)
3. `uv run --with pyyaml python3 /Users/jimmydaddy/.codex/skills/.system/skill-creator/scripts/quick_validate.py .codex/skills/technical-solution-review` (passed before review)

## 复核结论（2026-04-07）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：`review-verify` 仍按 `sourceFindings.length` 决定 pending/resolved；若 `review` 对“零 finding + uncovered rules”持久化 `review_pending`，同一链路的首次 `review-verify` 会立即 resolve 该 artifact，形成生命周期语义自相矛盾。
   - 处理：已接受并改为“仅当 emitted findings > 0 时才进入 `review_pending`”，同时把 uncovered projected rules 改写为 resolved artifact 中的 follow-up notes。

2. `2.2`
   - 判定：**认可**
   - 证据：`USER_FACING_TEXT_CHANGE` 把所有 `apps/**`、`packages/**` 改动都映射为 CS-033 applicable，会让内部实现文件持续背负不必要的 i18n coverage gap。
   - 处理：已接受并收窄为“更像用户文案面的路径或内容标记”，同时新增内部路径与用户文案路径两个回归场景。

### 验证命令

1. `pnpm run build`（通过）
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1 apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts`（通过）
3. `uv run --with pyyaml python3 /Users/jimmydaddy/.codex/skills/.system/skill-creator/scripts/quick_validate.py .codex/skills/technical-solution-review`（通过）

## 修复执行记录（2026-04-07）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/commands/review-command.ts`, `apps/cli/test/commands/review-command.test.ts`
   - 验证：`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1 apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check`
   - 说明：zero-finding review 现在会直接落为 `resolved`；uncovered projected rules 改为在 resolved artifact 中保留 follow-up notes，而不再错误维持 pending lifecycle。

2. `2.2`：已完成
   - 变更文件：`apps/cli/src/runtime/review/cli-hybrid-review-runtime.ts`, `apps/cli/src/constants/cli-review.constant.ts`, `apps/cli/test/commands/review-command.test.ts`
   - 验证：`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1 apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check`
   - 说明：`USER_FACING_TEXT_CHANGE` 现在只会命中更像用户文案面的路径或内容标记，并新增“内部实现文件不命中 / 用户文案文件命中”的双向回归场景。

## 处置结果与剩余风险

1. 本轮 2 条 accepted findings 已全部修复，并完成同窗口 `pnpm run build`、定向 `test:packages`、`test:integration`、`pnpm run check`、`uv ... quick_validate` 与治理同步检查。
2. `AGENTS.md` 与 `technical-solution-review` skill 在本轮未发现新的 actionable finding；它们当前的剩余风险主要是后续真实使用窗口中的 workflow adoption feedback，而非当前实现缺陷。
