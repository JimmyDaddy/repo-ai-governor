# TK-752 implement archive split and root manifest archived-entry compaction baseline

- Status: completed
- Date: 2026-04-11
- Owner: AI-Agent
- Priority: P0
- Project: `project-079-normative-loading-lifecycle-compaction-rollout`
- Sprint: `sprint-001-archive-split-and-bootstrap-truth-preservation`

## 1. 任务目标

落地 archive split 的第一阶段实施，使 root manifest 具备 `archived` entry zero-baseline 的迁移路径，同时保持 single-file bootstrap truth compatibility。

## 2. Depends On

1. `TK-751`

## 3. 预期产物

1. archive manifest 初始文件
2. root manifest archived-entry compaction baseline
3. archive split migration evidence

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-normative-loading/contracts/normative-loading-lifecycle-contract.md`
2. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
3. `.repo-ai-governor/context/dev/project-078-normative-loading-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-749-normative-loading-promotion-and-rollout-decomposition-handoff.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/normative-loading-manifest-lifecycle-compaction-and-staged-sharding-technical-solution.md`

## 6. 实施计划

1. 创建 archive manifest 与 root/archive migration baseline。
2. 将现有 archived entries 从 root manifest 迁出，并保留 rollback-friendly write-back path。
3. 确认 parser/gate 仍按 single-file bootstrap truth 运行。

## 7. Development Verification

1. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`
2. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-sprint-plan-status-sync.js`
2. `node ./scripts/governance/check-docs-triad-sync.js`

## 9. 执行记录

1. 2026-04-11：任务创建，状态初始化为 `planned`。
2. 2026-04-11：已创建 archive manifest sidecar，并把 root manifest 中既有 archived catalog 完整迁入 sidecar。
3. 2026-04-11：root manifest 已回到 archived-entry zero-baseline，single-file bootstrap truth 保持不变。

## 10. 产出

1. `.repo-ai-governor/normative_knowledge_sources/archive/normative-loading-manifest.archive.yaml`
2. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
3. `.repo-ai-governor/normative_knowledge_sources/governance/normative-loading-manifest-lifecycle-governance.md`
