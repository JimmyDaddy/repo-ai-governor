# DA-187 runtime.orchestration module deep migration and typed detail-doc gate cutover

- Status: active
- Date: 2026-03-26
- Owner: AI-Agent
- Task: `TK-187`
- Project: `project-017-technical-solution-modularization`
- Sprint: `sprint-002-module-migration-and-gate-cutover`

## 1. Summary

1. `runtime.orchestration` 已深化为可消费的 `overview + contract + adr` 模块文档。
2. `technical-solution-module-registry`、module graph gate 与 docs triad gate 已完成 typed detail-doc cutover，正式区分 `contract` 与 `adr`。
3. ADR 变化现在会产出 `adr_doc_change`，并保留推荐同步面而非错误阻断。

## 2. Key Outputs

1. [runtime-orchestration/module-overview.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/module-overview.md)
2. [runtime-orchestration contract](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/runtime-graph-execution-contract.md)
3. [runtime-orchestration ADR](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/graph-first-runtime-and-service-backed-execution-cutover.md)
4. [technical-solution-module-registry.js](/Users/jimmydaddy/study/ai-governor/scripts/governance/technical-solution-module-registry.js)
5. [check-technical-solution-module-graph.js](/Users/jimmydaddy/study/ai-governor/scripts/governance/check-technical-solution-module-graph.js)
6. [check-docs-triad-sync.js](/Users/jimmydaddy/study/ai-governor/scripts/governance/check-docs-triad-sync.js)
7. [docs-triad-sync-gate.integration.test.ts](/Users/jimmydaddy/study/ai-governor/test/docs-triad-sync-gate.integration.test.ts)
8. [technical-solution-module-graph-gate.integration.test.ts](/Users/jimmydaddy/study/ai-governor/test/technical-solution-module-graph-gate.integration.test.ts)

## 3. Acceptance

1. module registry 已兼容 `detail_docs[{path, kind}]`，并保持旧字符串列表兼容。
2. module graph gate 会拒绝非法 `detail_doc kind` 与缺失 contract detail doc。
3. docs triad gate 已能把 ADR 变化识别为 `local_detail_change` 路径。
