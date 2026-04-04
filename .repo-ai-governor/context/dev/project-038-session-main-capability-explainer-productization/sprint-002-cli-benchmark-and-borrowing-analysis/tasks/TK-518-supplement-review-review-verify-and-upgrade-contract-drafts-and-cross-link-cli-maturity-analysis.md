# TK-518 supplement review review-verify and upgrade contract drafts and cross-link cli maturity analysis

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P1
- Project: `project-038-session-main-capability-explainer-productization`
- Sprint: `sprint-002-cli-benchmark-and-borrowing-analysis`

## 1. 任务目标

围绕 CLI 能力成熟度分析，为 `review / review-verify` 与 `upgrade` 补齐专项 contract draft，并将其与现有 `plan` contract 和成熟度分析文做双向挂链，形成后续立项时可直接联读的输入集合。

## 2. Depends On

1. `.repo-ai-governor/draft/cli-capability-maturity-and-baseline-enhancement-priority-analysis.md`
2. `.repo-ai-governor/draft/session-main-plan-generation-and-ledger-commit-contract.md`
3. `apps/cli/src/commands/review-command.ts`
4. `apps/cli/src/commands/review-verify-command.ts`
5. `apps/cli/src/commands/upgrade-command.ts`

## 3. 预期产物

1. `review / review-verify` 专项 contract draft
2. `upgrade` 专项 contract draft
3. 薄基线命令 contract coverage 与立项检查点 cross-link

## 4. 实施计划

1. 盘点当前薄基线命令中已存在与尚缺失的专项 contract 覆盖。
2. 基于当前 `review / review-verify / upgrade` 的真实实现，补齐 follow-up draft，而不是凭空设计无关流程。
3. 将新 draft 与 CLI 成熟度分析文、既有 `plan` contract 做双向挂链，形成后续立项输入集合。
4. 同步 sprint 台账，保留 docs-only 执行记录。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`
4. docs-only update；未修改 `apps/**`、`packages/**`、`bin/**`、`test/**` 的可执行实现，因此 `pnpm run build` not required

## 6. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；范围限定为 draft 补强与 cross-link，不引入新的 runtime 行为变更。
2. 2026-04-04：确认当前薄基线命令里，`plan` 已有专项 contract，而 `review / review-verify / upgrade` 仍缺 follow-up draft。
3. 2026-04-04：已新增 `.repo-ai-governor/draft/session-main-review-generation-verification-and-ledger-backfill-contract.md` 与 `.repo-ai-governor/draft/upgrade-analysis-apply-and-rollback-contract.md`。
4. 2026-04-04：已将 CLI 成熟度分析文补成薄基线命令 contract coverage 入口，并为后续立项补充联读与检查点。
5. 2026-04-04：根据 follow-up review comments，为 `review / review-verify` 与 `upgrade` draft 补充 enum/constant 集中管理边界；同时明确 `review` 相关用户可见状态与结论必须通过 i18n key 映射，而不是直接把中文文案写入 contract truth。
