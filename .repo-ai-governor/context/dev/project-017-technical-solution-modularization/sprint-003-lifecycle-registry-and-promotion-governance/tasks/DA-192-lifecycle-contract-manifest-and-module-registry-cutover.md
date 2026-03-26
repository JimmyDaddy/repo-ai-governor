# DA-192 lifecycle contract、manifest and module registry cutover

- Status: active
- Date: 2026-03-26
- Owner: AI-Agent
- Task: `TK-192`
- Project: `project-017-technical-solution-modularization`
- Sprint: `sprint-003-lifecycle-registry-and-promotion-governance`

## 1. Summary

1. `governance.technical-solution-registry` 已新增 lifecycle contract，并将其纳入导出 contract 集合。
2. `normative-loading-manifest.yaml` 已登记 lifecycle registry external input 与新的 lifecycle contract doc。
3. `code_standards` 与 `long-term-maintenance-guide` 已把 lifecycle gate 升格为 blocking baseline。

## 2. Key Outputs

1. [technical-solution-lifecycle-registry-contract.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-technical-solution-registry/contracts/technical-solution-lifecycle-registry-contract.md)
2. [technical-solution-module-registry.yaml](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml)
3. [normative-loading-manifest.yaml](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml)
4. [code_standards.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md)
5. [long-term-maintenance-guide.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md)

## 3. Follow-Up Constraints

1. lifecycle registry 作为 external input，不进入默认启动集，但必须在 `technical_solution_promotion_change` 等命中场景可被显式加载。
2. 后续新增 lifecycle contract 版本时，应走 module-registry contract versioning，而不是静默替换 `v1` 语义。
