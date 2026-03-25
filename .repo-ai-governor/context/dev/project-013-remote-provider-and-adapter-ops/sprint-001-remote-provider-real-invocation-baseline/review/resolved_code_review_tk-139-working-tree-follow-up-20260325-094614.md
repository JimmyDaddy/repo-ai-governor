# Code Review: TK-139 Claude Code Follow-up 2

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
4. `test/first-batch-adapters-route.integration.test.ts`
5. `apps/cli/test/cli-governance-runtime.integration.test.ts`

## 2. Findings
### 2.1 [P1] Claude Code `CLI_EXEC` still overstates `STRUCTURED_OUTPUT` support
- 位置: `packages/adapters/claude-code/src/claude-code-agent-adapter.ts:59`
- 问题描述:
  - `CLAUDE_CODE_REAL_CAPABILITY_SUPPORT` 仍把 `STRUCTURED_OUTPUT` 标成 `SUPPORTED`。
  - 但实际执行固定走 `--output-format text`，`invokeStage()` 只回传 `responseText`，没有启用 `json` / `json-schema`，也没有任何结构校验。
  - 默认 routing 里 `reviewer` 这类 `requiredCapabilities=[STRUCTURED_OUTPUT]` 的角色仍可直接路由到 `claude-code`。
- 影响:
  - route runner / `verify --adapters` 会把 Claude Code 当成满足结构化输出要求的正式 surface，但真实输出仍是普通文本。
  - 这会把 capability truthfulness 重新拉回失真状态，且默认 reviewer 角色会直接命中这条路径。
- 建议:
  - 在真正接入 `json` / `json-schema` 并校验结果前，将 `STRUCTURED_OUTPUT` 至少降为 `DEGRADED`。
  - 若要保留 `SUPPORTED`，则必须把结构化输出契约显式接入 CLI 参数、解析与失败路径。

### 2.2 [P2] Route regression still does not guard structured-output truthfulness
- 位置: `test/first-batch-adapters-route.integration.test.ts:159`
- 问题描述:
  - 当前 route regression 已切到 Claude `CLI_EXEC`，修掉了旧的 baseline-stub coverage 问题。
  - 但它仍在 `requiredCapabilities=[STRUCTURED_OUTPUT]` 条件下选中 `claude-code`，同时 fixture 返回的仍是普通文本，测试没有验证结构化输出契约。
- 影响:
  - 即使 Claude Code 继续把结构化输出能力标得过高，这组回归仍会保持绿灯。
  - 这会让 `TK-139` 的 capability truthfulness 缺口继续隐藏在通过的测试之后。
- 建议:
  - 为 Claude Code 增加结构化输出 truthfulness 回归。
  - 当实现仍是 plain-text path 时，测试应明确要求 `STRUCTURED_OUTPUT` 不得标记为 `SUPPORTED`。

## 3. Notes
1. 你上一轮贴出的 “baseline Claude stub 仍被 route test 锁定” finding 在当前 working tree 已修复；这轮新增主问题不再是 baseline/stub，而是 capability advertisement 仍高于真实实现。
2. 本轮未复跑全量 `check` 或 release gate，只针对 Claude Code adapter 与相关 integration 覆盖做了复核。

## 4. Verification
1. `claude --help | sed -n '1,220p'`（通过）
2. `pnpm -s vitest run packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts apps/cli/test/runtime/claude-code-exec-fixture-runtime.test.ts test/first-batch-adapters-route.integration.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 5. 复核结论（2026-03-25）
结论：认可 2 条 finding，但当前 working tree 已包含对应修复，本轮未再引入额外代码改动。

1. `2.1` 已认可。
   - `packages/adapters/claude-code/src/claude-code-agent-adapter.ts` 中 `CLAUDE_CODE_REAL_CAPABILITY_SUPPORT[STRUCTURED_OUTPUT]` 当前已为 `DEGRADED`，不再夸大 plain-text `CLI_EXEC` 路径。
   - `apps/cli/src/main.ts` 与 `apps/cli/test/cli-governance-runtime.integration.test.ts` 中默认 reviewer route 已回切到 Codex 主选，Claude Code 仅保留为 fallback。
2. `2.2` 已认可。
   - `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts` 已补齐 `STRUCTURED_OUTPUT=DEGRADED` 断言。
   - `test/first-batch-adapters-route.integration.test.ts` 已改为 fail-closed 语义：当结构化输出候选只剩降级 surface 时，不再继续选中 Claude Code。

## 6. 修复执行记录（2026-03-25）
1. 本轮 pending CR 复核时，相关代码与测试已处于修复完成状态，因此未追加新的实现补丁。
2. 已重新运行定向 TypeScript 与 Vitest 验证，确认修复仍然成立，并将本 CR 直接收尾为 `resolved`。
