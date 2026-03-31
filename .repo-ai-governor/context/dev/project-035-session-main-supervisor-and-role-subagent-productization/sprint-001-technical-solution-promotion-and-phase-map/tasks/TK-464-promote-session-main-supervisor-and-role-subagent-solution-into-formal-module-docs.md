# TK-464 promote session.main supervisor and role-subagent solution into formal module docs

- Status: completed
- Date: 2026-03-31
- Owner: AI-Agent
- Priority: P0
- Project: `project-035-session-main-supervisor-and-role-subagent-productization`
- Sprint: `sprint-001-technical-solution-promotion-and-phase-map`

## 1. 任务目标

将 `.repo-ai-governor/draft/session-main-agent-answer-and-command-handoff-technical-solution.md` 正式投影为 `runtime.orchestration + runtime.cli-interactive-shell` 的 lifecycle-managed module docs，并为 supervisor bootstrap follow-up 保留 planned execution truth。

## 2. Depends On

1. `.repo-ai-governor/context/dev/project-033-session-main-agent-runtime-productization/project-033-session-main-agent-runtime-productization-completion-audit-summary.md`

## 3. 预期产物

1. 更新后的 `runtime-orchestration/module-overview.md`
2. 新增 `runtime-orchestration/adrs/session-main-supervisor-and-role-subagent-collaboration.md`
3. 更新后的 `runtime-cli-interactive-shell/module-overview.md`
4. 更新后的 `runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
5. 同步后的 lifecycle / delivery / module-registry / manifest / review / artifact
6. planned `sprint-002-answer-supervisor-and-role-subagent-bootstrap`

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
2. 2026-03-31：确认该 draft 的正式归宿是并入既有 active solution `technical-solution.interactive-cli-react-style-cli` 的 `v5`，而不是拆出新的平行 lifecycle solution。
3. 2026-03-31：将 service-owned `session.main supervisor` 正式归属到 `runtime.orchestration`，新增 orchestration ADR；CLI shell 只补 consumer-side transcript/recap contract，不把 supervisor runtime 错写到 shell 模块里。
4. 2026-03-31：同步扩展 `runtime.cli-interactive-shell` module overview 与 `cli-session-shell-contract`，收口 answer / follow-up / command handoff / role collaboration 的 presenter 边界。
5. 2026-03-31：创建 `project-035` 与 planned `sprint-002`，把 direct answer bootstrap、role-subagent collaboration 与 command handoff governance 真正落实到 follow-up execution truth；同窗口通过全部 promotion gates，docs-only 因此 build not required。
6. 2026-03-31：补充文档边界澄清，明确 `connect apply` 激活的是配置/后台执行真值，而前台 `session.main` 直接使用 connected roles 要从 `sprint-002` 起逐步落地；同时固定 `main agent != planner role != backend workflow planner` 的职责分层。
