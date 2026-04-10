# DA-757 sprint-001 archive split acceptance and sprint-002 handoff

- Status: active
- Date: 2026-04-11
- Owner: AI-Agent
- Task: `TK-757`
- Project: `project-079-normative-loading-lifecycle-compaction-rollout`
- Sprint: `sprint-001-archive-split-and-bootstrap-truth-preservation`

## 1. Summary

1. sprint-001 已完成 archive manifest schema、lifecycle governance surface 与 archived-entry zero-baseline baseline。
2. `CR-001` 的 accepted finding 已修复并收口，`CR-002` fresh recheck 返回 clean 结论。
3. sprint-002 现在可以接续实现 deprecated grace-window compaction、archive integrity gate 与 monthly audit enforcement。

## 2. Delivered Baseline

1. `.repo-ai-governor/normative_knowledge_sources/governance/normative-loading-manifest-lifecycle-governance.md`
2. `.repo-ai-governor/normative_knowledge_sources/archive/normative-loading-manifest.archive.yaml`
3. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
4. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-001-archive-split-and-bootstrap-truth-preservation/review/resolved_code_review_working-tree-20260411-0054.md`
5. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-001-archive-split-and-bootstrap-truth-preservation/review/resolved_code_review_working-tree-20260411-0120.md`

## 3. Sprint-002 Activation Inputs

1. `deprecated_at` 字段与 `14` 天 grace-window 已在 governance doc 固定，但对应命令与 gate 仍待 sprint-002 落地。
2. archive sidecar 已存在，后续 archive integrity gate 只需围绕 `status purity`、`doc_id/path` non-overlap 与 overdue deprecated backlog 实现。
3. 当前窗口未引入 active sharding、`manifest_refs` 或 sqlite truth cutover，sprint-002 不得越界扩 scope。

## 4. Verification Evidence

1. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`（通过）
2. `node ./scripts/governance/check-docs-triad-sync.js`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
