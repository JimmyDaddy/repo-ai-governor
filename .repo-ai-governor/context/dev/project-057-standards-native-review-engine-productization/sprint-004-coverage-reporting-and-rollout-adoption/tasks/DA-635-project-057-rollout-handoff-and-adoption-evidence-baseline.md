# DA-635 project-057 rollout handoff and adoption evidence baseline

- Status: completed
- Date: 2026-04-07
- Project: `project-057-standards-native-review-engine-productization`
- Sprint: `sprint-004-coverage-reporting-and-rollout-adoption`
- Task: `TK-635`

## 1. Summary

1. `project-057` 现已具备一条可回放的 sprint-004 rollout handoff：native `review` 输出会显式报告 coverage summary、delegated activation policy 与 manual-only gap truth。
2. `TK-633` 把 coverage metrics 写入 canonical review artifact、queued review payload 与 command result details；`TK-634` 则把 delegated activation policy 收口为 `optional / recommended / required` 的正式 contract。
3. project-final closeout 所需的 adoption evidence 已形成最小输入包，不再只依赖 sprint-001/002/003 的阶段性设计说明。

## 2. Adoption Evidence

1. CLI runtime 现通过 `CliHybridReviewContext.coverageSummary` 输出：
   - total applicable projected rules
   - deterministic covered rules
   - standards-guided covered rules
   - residual gap rules
   - manual-only gap rules
2. CLI runtime 现通过 `CliHybridReviewContext.delegatedReviewActivationPolicy` 输出：
   - activation level：`optional | recommended | required`
   - reason codes
   - manual follow-up required flag
   - delegatable gap rule ids
3. Canonical review markdown artifact 现新增 `## 5. Coverage Summary`，并在 delegated reviewer handoff section 中保留 activation-policy truth。
4. queued review request artifact 与 `commandResult.details` 现暴露相同 coverage / activation fields，方便 future runtime 或 adopter-facing client 复用而不解析 markdown prose。

## 3. Project-Final Closeout Inputs

1. `project-057` project plan 与 `sprint-004` sprint plan
2. `sprint-001` 的 `DA-621` promotion and rollout handoff
3. `sprint-003` 的 `DA-648` closeout and sprint-004 activation handoff
4. sprint-004 当前 task ledger 与后续 fresh reviewer CR artifact
5. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml` 中 `technical-solution.standards-native-code-review-engine-follow-up` 的 rollout artifacts

## 4. Residual Risks

1. native `review` 当前只落地 activation policy 与 coverage truth，并未在产品命令路径中自动 dispatch delegated reviewer；这一点仍由后续 project-final closeout 明确对外叙事边界。
2. `manual_only` gap 当前在 Phase A projected rule bundle 中仍为 `0`，但 contract 已预留显示位，后续引入 `manual_only` rules 时无需再改 canonical reporting shape。
3. project-final CR 仍需验证 sprint-004 当前实现与 rollout docs 是否能在同一窗口通过 build / check / governance sync gate。

## 5. Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/cli-hybrid-review-runtime.test.ts apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts`
2. `pnpm run build`
