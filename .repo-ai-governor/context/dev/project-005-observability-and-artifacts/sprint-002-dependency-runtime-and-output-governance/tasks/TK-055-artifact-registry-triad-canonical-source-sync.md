# TK-055 Artifact Registry triad canonical-source 同步

- Status: completed
- Date: 2026-03-21
- Owner: AI-Agent
- Priority: P1
- Project: `project-005-observability-and-artifacts`
- Sprint: `sprint-002-dependency-runtime-and-output-governance`

## 1. 任务目标

将 PRD、brief、overall solution 与 architecture 中关于 Artifact Registry 的 canonical source 与 rendered view 口径同步收敛。

## 2. Depends On

1. `TK-054`
2. `TK-048`
3. `TK-049`

## 3. 预期产物

1. 已同步的 triad 文档与简版 PRD。
2. `verified_review_tk-055-artifact-registry-triad-canonical-source-sync.md`。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-002-dependency-runtime-and-output-governance/tasks/TK-054-artifact-registry-single-source-cleanup.md`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
3. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
5. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`

## 5. 实施计划

1. 在 PRD 与 brief 中补齐 Artifact Registry canonical source / rendered view 的产品约束。
2. 在 overall solution 中移除 `dependency-artifact-registry` 作为可选落盘形态的旧口径。
3. 在 architecture 中同步 workspace 结构示意与 artifact registry 路径落位。
4. 运行 triad sync、manifest gate 与常规任务台账门禁，确保文档与执行态收敛一致。

## 6. 验证计划

1. `node ./scripts/governance/check-docs-triad-sync.js`
2. `node ./scripts/governance/run-normative-loading-manifest-gate.js`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
5. `pnpm run check`

## 7. 执行记录

1. 2026-03-21：任务创建，状态初始化为 `planned`。
2. 2026-03-21：任务启动，状态切换为 `in_progress`，开始同步 triad/brief 中关于 Artifact Registry canonical source 与 rendered view 的口径。
3. 2026-03-21：完成四份规范文档同步与日期刷新，并通过 triad sync、manifest gate、task ledger、sprint status 与全量检查，任务切换为 `completed`。

## 8. 产出

1. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
