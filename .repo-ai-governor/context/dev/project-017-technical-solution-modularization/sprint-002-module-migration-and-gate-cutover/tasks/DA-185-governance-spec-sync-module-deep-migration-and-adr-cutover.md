# DA-185 governance.spec-sync module deep migration and adr cutover

- Status: active
- Date: 2026-03-26
- Owner: AI-Agent
- Task: `TK-185`
- Project: `project-017-technical-solution-modularization`
- Sprint: `sprint-002-module-migration-and-gate-cutover`

## 1. Summary

1. `governance.spec-sync` 已从 skeleton overview 提升为可消费的 `overview + contract + adr` 模块文档。
2. Spec Sync contract 已显式引入 `change_kind`，支持区分 `contract_doc_change` 与 `adr_doc_change`。
3. triad / brief / module impact escalation 语义已经回收到模块文档，而不是继续隐式藏在历史任务里。

## 2. Key Outputs

1. [governance-spec-sync/module-overview.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-spec-sync/module-overview.md)
2. [governance-spec-sync contract](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-spec-sync/contracts/spec-sync-impact-classification-contract.md)
3. [governance-spec-sync ADR](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-spec-sync/adrs/spec-sync-escalation-and-module-impact-routing.md)
4. [technical-solution-module-registry.yaml](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml)

## 3. Acceptance

1. governance.spec-sync 已具备 contract 与 ADR 的清晰边界。
2. Spec Sync 结果模型已能表达 `change_kind`。
3. 模块 ADR 变化默认不再误触发 exported contract blocking 规则。
