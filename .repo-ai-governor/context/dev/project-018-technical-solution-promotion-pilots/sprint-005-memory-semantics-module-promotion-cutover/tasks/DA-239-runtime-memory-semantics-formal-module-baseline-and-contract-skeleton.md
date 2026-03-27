# DA-239 runtime.memory-semantics formal module baseline and contract skeleton

- Status: active
- Date: 2026-03-27
- Owner: AI-Agent
- Task: `TK-239`
- Project: `project-018-technical-solution-promotion-pilots`
- Sprint: `sprint-005-memory-semantics-module-promotion-cutover`

## 1. Summary

1. 已新增 `runtime.memory-semantics` 的 formal module overview。
2. 已新增两份 contract：
   - `contract.memory.recall-policy.v1`
   - `contract.memory.context-assembly.v1`
3. 已新增 `working-memory-and-canonical-source-boundary` ADR。
4. 已同步 `runtime.orchestration` 的 direct-consumer 说明，使其正式依赖 memory context assembly contract，而不是继续把 memory policy 暗含在 runtime owner 内部。

## 2. Outputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/module-overview.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/contracts/memory-recall-policy-contract.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/contracts/memory-context-assembly-contract.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-memory-semantics/adrs/working-memory-and-canonical-source-boundary.md`
