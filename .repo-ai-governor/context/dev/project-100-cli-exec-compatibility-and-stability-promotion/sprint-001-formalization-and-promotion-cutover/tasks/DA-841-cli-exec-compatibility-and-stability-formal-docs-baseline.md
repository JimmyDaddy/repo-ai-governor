# DA-841 cli-exec compatibility and stability formal docs baseline

- Status: active
- Date: 2026-04-13
- Owner: AI-Agent
- Task: `TK-841`
- Project: `project-100-cli-exec-compatibility-and-stability-promotion`
- Sprint: `sprint-001-formalization-and-promotion-cutover`

## 1. Summary

1. `runtime.agent-projection` formal docs 已正式写入 native `cli_exec` compatibility/stability baseline。
2. 新增 producer ADR，固定 `scenario class x required preserved facts` taxonomy、focused verification profiles 与 trigger matrix guidance。
3. `agent-invoke-liveness-contract` 与 `adapter-health-and-route-probe-contract` 只补充 additive clarification，没有新增 minimum fields。
4. 当前 formal truth 继续保持 ACP 非公开、diagnostics 可选、gate truth 独立的边界。

## 2. Outputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-compatibility-and-stability-productization.md`
