# TK-459 promote session-shell output presentation and markdown rendering solution into formal module docs

- Status: completed
- Date: 2026-03-31
- Owner: AI-Agent
- Priority: P0
- Project: `project-032-command-live-progress-react-shell-productization`
- Sprint: `sprint-004-session-shell-output-presentation-and-markdown-promotion`

## 1. 任务目标

将 `.repo-ai-governor/draft/session-shell-output-presentation-and-markdown-rendering-technical-solution.md` 正式投影为 `runtime.cli-interactive-shell` 的 lifecycle-managed module docs，并为后续 renderer / markdown rollout 保留 planned follow-up truth。

## 2. Depends On

1. `TK-450`

## 3. 预期产物

1. 更新后的 `runtime-cli-interactive-shell/module-overview.md`
2. 更新后的 `runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
3. 新增 `runtime-cli-interactive-shell/adrs/structured-session-output-and-markdown-content-blocks.md`
4. 同步后的 lifecycle / delivery / module-registry / manifest / review / artifact
5. planned `sprint-005-session-shell-output-presentation-and-markdown-productization`

## 4. 验证

1. `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`
2. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
3. `node ./scripts/governance/check-technical-solution-module-graph.js`
4. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`
5. `node ./scripts/governance/check-docs-triad-sync.js`
6. `node ./scripts/governance/check-task-ledger-sync.js`
7. `node ./scripts/governance/check-sprint-plan-status-sync.js`
8. `node ./scripts/governance/check-code-review-status-sync.js`
9. `node ./scripts/governance/check-artifact-registry-lifecycle.js`

## 5. Execution Notes

1. 2026-03-31：任务创建，状态初始化为 `planned`。
2. 2026-03-31：确认该 draft 的最自然正式归宿是并入既有 active solution `technical-solution.interactive-cli-react-style-cli` 的 `runtime.cli-interactive-shell` module，而不是拆出新 module；formal doc 落点确定为 `module-overview + cli-session-shell-contract + new ADR`。
3. 2026-03-31：新增 `structured-session-output-and-markdown-content-blocks.md` ADR，正式收口“结构化壳层 + Markdown 内容块”方向，并明确 `progress/status` 与 `assistant markdown / command recap` 的分层渲染边界。
4. 2026-03-31：扩展 `module-overview.md` 与 `cli-session-shell-contract.md`，把 transcript render-kind、running dock separation、Markdown content blocks 与 implementation-follow-up truth 纳入正式 contract。
5. 2026-03-31：同步更新 lifecycle / delivery registry、module registry、normative manifest、artifact registry 与 `project-032` sprint ledger，并创建 planned `sprint-005` 承接 transcript render-kind / markdown renderer 的真实实现；同窗口通过全部 promotion gates，docs-only 因此 build not required。
