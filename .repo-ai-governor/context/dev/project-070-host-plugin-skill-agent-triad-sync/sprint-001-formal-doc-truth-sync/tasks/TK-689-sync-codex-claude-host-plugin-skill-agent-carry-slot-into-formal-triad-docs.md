# TK-689 sync codex claude host plugin skill agent carry slot into formal triad docs

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-070-host-plugin-skill-agent-triad-sync`
- Sprint: `sprint-001-formal-doc-truth-sync`

## 1. 任务目标

把当前 draft 中新增的 Codex / Claude Code plugin / skill / agent lifecycle 与 adopter consumption carry slot，同步进正式 PRD / brief / technical solution / architecture 文档，避免未来盘点时再次遗漏。

## 2. Depends On

1. `.repo-ai-governor/draft/repo-ai-governor-current-surface-gap-guide-project-sprint-task-decomposition.md`
2. `project-069` host/plugin/skill/agent carry-slot refresh
3. `project-050` host-native distribution closeout evidence

## 3. 预期产物

1. 同步后的 triad + brief 正式文档
2. 对 host-native ergonomics lifecycle / upgrade / support-truth / adopter consumption 的显式需求与方案表述
3. 可回溯到 `project-067` future stream 的正式文档线索

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
3. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
5. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
6. `.repo-ai-governor/draft/repo-ai-governor-current-surface-gap-guide-project-sprint-task-decomposition.md`
7. `.repo-ai-governor/context/dev/project-069-host-plugin-skill-agent-decomposition-refresh/plan.md`
8. `.repo-ai-governor/context/dev/project-050-governance-surface-clients-host-distribution-rollout/project-050-governance-surface-clients-host-distribution-rollout-completion-audit-summary.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-061-current-surface-gap-task-decomposition-draft/plan.md`
2. `.repo-ai-governor/context/dev/project-069-host-plugin-skill-agent-decomposition-refresh/plan.md`

## 6. 实施计划

1. 先确认 triad 当前是否只写了“入口适配”和“工具接入”，但没有显式承载 host plugin / skill / subagent / hooks / MCP 的后续生命周期。
2. 在 PRD 中补“需求层显式能力与支持边界”，在总方案中补“分发/升级/验证 contract”，在架构蓝图中补“承载位置与模块责任”。
3. 同步简版 PRD 与日期字段，确保 triad/brief 一致。

## 7. Development Verification

1. docs/source cross-check：triad docs、brief、decomposition draft、project-050 / project-069 traceback

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --task-id TK-689`
2. `node ./scripts/governance/check-docs-triad-sync.js`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
5. docs-only sync window：未修改 `apps/**`、`packages/**`、`bin/**`、`test/**` 可执行代码，因此 `pnpm run build` not required

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `in_progress`；本轮目标是把 host/plugin/skill/agent carry slot 从 draft 真值提升到正式 triad 真值。
2. 2026-04-08：已复核 `project-050` 与 `project-069` 的已有证据，确认目前缺的不是 baseline 实现，而是正式 PRD / brief / technical solution / architecture 对 host-native lifecycle 与 adopter consumption 的显式承载。
3. 2026-04-08：已同步更新完整版 PRD、简版 PRD、总技术方案与架构蓝图，把 project-local assets、plugin bundles、skills/agents、hooks/subagents、MCP 的 `export / apply / verify / upgrade / support-truth` contract 写入正式真值。
4. 2026-04-08：triad 正式文档同步完成，任务完成。

## 10. 产出

1. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
