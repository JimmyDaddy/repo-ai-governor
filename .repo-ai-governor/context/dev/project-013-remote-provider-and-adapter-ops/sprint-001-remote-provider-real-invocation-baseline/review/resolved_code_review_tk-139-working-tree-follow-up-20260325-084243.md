# Code Review: TK-139 Claude Code Follow-up

- Status: resolved
- Date: 2026-03-25
- Reviewer: AI-Agent
- Task: `TK-139`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/sprint-001-remote-provider-real-invocation-baseline/tasks/TK-139-claude-code-remote-provider-real-invocation-and-fallback-degrade.md`
  - `.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/sprint-001-remote-provider-real-invocation-baseline/tasks/DA-139-claude-code-remote-provider-real-invocation-and-fallback-degrade.md`

## 1. Review Scope
1. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
2. `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
3. `apps/cli/src/main.ts`
4. `apps/cli/src/runtime/adapter-routing-runtime.ts`
5. `apps/cli/test/cli-governance-runtime.integration.test.ts`
6. `apps/cli/test/runtime/claude-code-exec-fixture-runtime.test.ts`
7. `test/first-batch-adapters-route.integration.test.ts`

## 2. Findings
### 2.1 [P1] Claude Code `CLI_EXEC` still overstates `STRUCTURED_OUTPUT` support
- 位置: `packages/adapters/claude-code/src/claude-code-agent-adapter.ts:59`, `packages/adapters/claude-code/src/claude-code-agent-adapter.ts:195`, `packages/adapters/claude-code/src/claude-code-agent-adapter.ts:711`, `apps/cli/src/main.ts:160`
- 问题描述:
  - `CLAUDE_CODE_REAL_CAPABILITY_SUPPORT` 仍把 `STRUCTURED_OUTPUT` 标记为 `SUPPORTED`。
  - 但当前 `CLI_EXEC` 实现固定使用 `--output-format text`，`invokeStage()` 也只回传原始 `responseText`，没有启用 `json`/`json-schema` 模式，也没有对输出结构做任何校验或约束。
  - 默认 CLI routing 仍把 `reviewer` 这类 `requiredCapabilities=[STRUCTURED_OUTPUT]` 的角色指向 `claude-code`，因此 `verify`/route runner 会把这条 plain-text 路径当成满足结构化输出要求的正式 surface。
- 影响:
  - 结构化输出角色会被错误地路由到 Claude Code，并在没有结构保证的情况下继续执行。
  - 这会再次引入 `probe/capability/route` 与真实执行面的漂移，直接违反 `project-013` 当前 sprint 的 truthfulness 目标。
- 建议:
  - 在没有真正接入 `--output-format json` / `--json-schema` 并校验结果前，将 `STRUCTURED_OUTPUT` 至少降为 `DEGRADED`。
  - 若要保留 `SUPPORTED`，则必须把结构化输出约束显式接进 CLI 参数与解析逻辑，并补齐失败路径。

### 2.2 [P2] Current Claude Code regression coverage still does not guard structured-output truthfulness
- 位置: `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts:61`, `test/first-batch-adapters-route.integration.test.ts:159`
- 问题描述:
  - `truthful capability matrix in cli_exec mode` 只断言了 `CONFIRMATION_GATE/CANCELLATION`，没有断言 `STRUCTURED_OUTPUT`。
  - route integration 继续以 `requiredCapabilities=[STRUCTURED_OUTPUT]` 选中 `claude-code`，但 fixture 返回的仍是普通文本，测试没有验证结构化输出契约。
- 影响:
  - 上面的 capability 夸大问题可以长期保持绿灯。
  - 后续如果继续依赖这些回归用例，会把“可被路由到结构化输出角色”误当成“已经具备结构化输出保证”。
- 建议:
  - 为 Claude Code `CLI_EXEC` 增加结构化输出 truthfulness 用例。
  - 如果当前实现仍是 plain-text path，则回归测试应明确要求 `STRUCTURED_OUTPUT` 不得被标成 `SUPPORTED`。

## 3. Notes
1. 上一轮 `test/first-batch-adapters-route.integration.test.ts` “仍锁定 baseline Claude stub” 的 finding 在当前 working tree 已修复：route/runtime 已切到 Claude `CLI_EXEC` fixture，不再复用 baseline adapter。
2. 这轮新增问题不在于 Claude 还没接真实 CLI，而在于 capability advertisement 仍高于真实输出契约。

## 4. Verification
1. `claude --help | sed -n '1,220p'`（通过）
2. `pnpm -s vitest run packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts apps/cli/test/runtime/claude-code-exec-fixture-runtime.test.ts test/first-batch-adapters-route.integration.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 5. 复核结论（2026-03-25）
结论：认可 2 条 finding，并已全部修复。

1. `2.1` 已认可。
   - `packages/adapters/claude-code/src/claude-code-agent-adapter.ts` 中 `CLI_EXEC` 的 `STRUCTURED_OUTPUT` 已降为 `DEGRADED`，不再把 plain-text `--output-format text` 路径宣传为正式结构化输出能力。
   - `apps/cli/src/main.ts` 和 `apps/cli/test/cli-governance-runtime.integration.test.ts` 中默认 reviewer route 已切回 Codex 主选，避免结构化输出角色优先落到 Claude Code。
2. `2.2` 已认可。
   - `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts` 已补齐 `STRUCTURED_OUTPUT=DEGRADED` 断言。
   - `test/first-batch-adapters-route.integration.test.ts` 已改为验证：当结构化输出候选只剩降级 surface 时，route runner 必须 fail-closed，而不是继续选中 Claude Code。

## 6. 修复执行记录（2026-03-25）
1. 已修复 Claude Code capability truthfulness 夸大问题，并将 `DA-139` 同步到最新口径。
2. 已补齐 smoke / route / CLI runtime 回归，覆盖结构化输出 truthfulness 与 fail-closed 语义。
