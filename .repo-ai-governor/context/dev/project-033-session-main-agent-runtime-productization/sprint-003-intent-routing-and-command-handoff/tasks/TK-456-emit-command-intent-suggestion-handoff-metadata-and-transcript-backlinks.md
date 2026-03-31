# TK-456 emit command-intent suggestion handoff metadata and transcript backlinks

- Status: completed
- Date: 2026-03-31
- Owner: AI-Agent
- Priority: P0
- Project: `project-033-session-main-agent-runtime-productization`
- Sprint: `sprint-003-intent-routing-and-command-handoff`

## 1. 任务目标

继续把 `session.main` 的 command-intent / handoff metadata 从“可见 suggestion”推进到“可追踪 backlink”，为后续 richer consumer 和 artifact-aware transcript 铺底。

## 2. Depends On

1. `TK-455`

## 3. 预期产物

1. richer handoff metadata contract
2. transcript backlinks or artifact references baseline
3. downstream consumer compatibility notes
4. tests covering backlink-aware rendering path

## 4. 验证

1. `pnpm run build`
2. targeted Vitest covering metadata/backlink rendering path
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 5. Execution Notes

1. 2026-03-31：任务创建，状态初始化为 `planned`。
2. 2026-03-31：已为 `session.main` completed payload 增加 `handoffBacklinks` 数组，覆盖 slash command、execution intent 与 command preview 三类 backlink。
3. 2026-03-31：`CliSessionShellTranscriptStore` 已补齐 backlink lines 渲染，并通过 build + targeted tests 验证。
