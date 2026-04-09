# TK-733 uplift adopter-facing support wording only when evidence gate passes

- Status: completed
- Date: 2026-04-09
- Owner: AI-Agent
- Priority: P0
- Project: `project-076-transport-selection-authority-rollout`
- Sprint: `sprint-003-evidence-gated-docs-and-adopter-truth`

## 1. 任务目标

仅在 clean-room / verify evidence gate 通过时，升级 adopter-facing docs 的 transport-aware support wording。

## 2. Depends On

1. `TK-732`
2. `docs/support-matrix.md`
3. `docs/local-adoption-playbook.md`

## 3. 预期产物

1. gated docs wording update
2. evidence backlinks
3. support truth change note

## 4. Required Inputs

1. `docs/support-matrix.md`
2. `docs/local-adoption-playbook.md`
3. `docs/support-matrix.zh-CN.md`
4. `docs/local-adoption-playbook.zh-CN.md`

## 5. Traceback References

1. `TK-732`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`

## 6. 实施计划

1. 根据 evidence verdict 决定是否 uplift public wording。
2. 若 gate 未通过，则只记录 gap / hold line，不提升 wording。
3. 将 support wording 与 evidence artifact 回链绑定。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `node ./scripts/governance/check-docs-triad-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-09：任务创建，状态初始化为 `planned`。
2. 2026-04-10：`TK-732 / DA-732` 判定 evidence gate 通过后，已完成 `docs/support-matrix*` 与 `docs/local-adoption-playbook*` 的保守 wording uplift，明确 Codex / Claude Code 显式 `remote_api` 路径具备证据支撑、仍保持 environment-gated，且 warning 语义不代表静默 `cli_exec` fallback 成功。

## 10. 产出

1. `docs/support-matrix.md`
2. `docs/support-matrix.zh-CN.md`
3. `docs/local-adoption-playbook.md`
4. `docs/local-adoption-playbook.zh-CN.md`
5. `.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/sprint-003-evidence-gated-docs-and-adopter-truth/tasks/DA-732-remote-api-clean-room-and-verify-evidence-summary.md`
