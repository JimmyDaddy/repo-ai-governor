# sprint-002-cli-benchmark-and-borrowing-analysis 计划

- Status: completed
- Date: 2026-04-04
- Project: `project-038-session-main-capability-explainer-productization`
- Sprint Goal: 结合本地 `claude-code` 与 `codex` 仓库，对 `repo-ai-governor` CLI 做一次面向借鉴学习的结构化对标分析，并把薄基线命令的后续 contract 输入一起沉淀为 draft。

## 1. Task Package

1. `TK-517` analyze borrowable cli capabilities from claude-code and codex and record draft recommendations
2. `TK-518` supplement review review-verify and upgrade contract drafts and cross-link cli maturity analysis
3. `TK-519` promote cli capability maturity analysis draft into active formal docs

## 2. Exit Criteria

1. 已对 `repo-ai-governor`、`claude-code`、`codex` 的 CLI 入口、会话生命周期、扩展机制、状态持久化与交互运行时做结构化对比。
2. 已明确区分“立即可借鉴”“条件化引入”“暂不建议照搬”三类能力，而不是只做 feature list 摘抄。
3. 分析结果已保存到 `.repo-ai-governor/draft/`，并给出面向近期实现窗口的 adoption 顺序。
4. `plan / review / review-verify / upgrade` 这批薄基线命令的专项 contract draft 已形成可联读输入集合。
5. CLI 能力成熟度分析已正式提升为 `runtime.cli-interactive-shell` active ADR，并与 lifecycle / delivery / module / manifest 保持同步。
6. sprint 台账与 `current-context.md` 已同步到本次 docs-only 分析工作。

## 3. Milestones

1. 2026-04-04：创建 `sprint-002-cli-benchmark-and-borrowing-analysis`，承接本轮 CLI benchmark draft 工作。
2. 2026-04-04：完成 `TK-517`，已把 `claude-code` / `codex` 的可借鉴能力与不建议直接照搬项沉淀为 `.repo-ai-governor/draft/cli-borrowing-analysis-against-claude-code-and-codex.md`。
3. 2026-04-04：完成 `TK-518`，已为 `review / review-verify / upgrade` 补齐专项 contract draft，并将其与 CLI 成熟度分析文做双向挂链。
4. 2026-04-04：完成 `TK-519`，已将 CLI 能力成熟度分析正式提升为 `runtime.cli-interactive-shell` ADR，并同步 lifecycle / delivery / module registry / manifest / promotion review / DA 证据。
