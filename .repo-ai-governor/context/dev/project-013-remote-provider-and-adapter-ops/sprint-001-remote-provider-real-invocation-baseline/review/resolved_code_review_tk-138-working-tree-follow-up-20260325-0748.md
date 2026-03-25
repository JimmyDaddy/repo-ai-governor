# Code Review: TK-138 工作树 follow-up（2026-03-25 07:48）

- Status: resolved
- Date: 2026-03-25
- Reviewer: AI-Agent
- Task: `TK-138`
- Review Type: follow-up comment resolution
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/plan.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`

## 1. Accepted Findings

1. `CLI_EXEC` / `BASELINE` 是跨 adapter 的闭合集合，不应在 `codex` 与 `github-copilot` 各自重复定义。
2. `probe/invoke` 操作集合同样属于共享有限集合，应由统一 enum 管理，而不是在各 adapter 中重复写字符串字面量。
3. `Codex` 与 `GitHub Copilot` 的 CLI exec runner 与 adapter options 契约具有明显公共基线，应先抽取顶层基础契约，再由各 adapter 扩展差异字段。

## 2. Resolution

1. 新增 `packages/adapter-sdk/src/constants/agent-cli-exec.constant.ts`，集中管理：
   - `AgentCliExecutionMode`
   - `AgentCliExecOperation`
2. 新增 `packages/adapter-sdk/src/types/interfaces/agent-cli-exec.interface.ts`，抽取：
   - `AgentCliExecRunnerRequest`
   - `AgentCliExecRunnerResult`
   - `AgentCliExecRunner`
   - `AgentCliAdapterOptions`
3. `packages/adapters/codex/src/constants/codex-agent-adapter.constant.ts` 与 `packages/adapters/github-copilot/src/constants/github-copilot-agent-adapter.constant.ts` 改为对共享 enum 的别名导出，保留 provider package 公共 API 稳定。
4. `packages/adapters/codex/src/types/interfaces/codex-agent-adapter.interface.ts` 与 `packages/adapters/github-copilot/src/types/interfaces/github-copilot-agent-adapter.interface.ts` 改为消费 shared base contract；GitHub Copilot 仅保留 `commandArgumentsPrefix` 扩展。
5. `codex/github-copilot` adapter 实现、fixture runtime 和相关测试统一切到 `AgentCliExecOperation`，不再散落 `"probe" | "invoke"` 字面量。

## 3. Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm -s vitest run packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts apps/cli/test/runtime/codex-exec-fixture-runtime.test.ts apps/cli/test/runtime/github-copilot-exec-fixture-runtime.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`
