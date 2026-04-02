# Code Review: project-037 remote-api transport working tree

- Status: resolved
- Date: 2026-04-02
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`

## 1. Review Scope
1. `packages/shared/src/types/interfaces/adapter-runtime-config.interface.ts`
2. `packages/config/src/schema-validator.ts`
3. `apps/cli/src/runtime/adapter-routing-runtime.ts`
4. `apps/cli/src/runtime/adapter-verification-runtime.ts`
5. `packages/adapter-sdk/src/layered-health-check-runtime.ts`
6. `packages/adapters/codex/src/codex-agent-adapter.ts`
7. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
8. `packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`
9. `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
10. `apps/cli/test/runtime/adapter-routing-runtime.test.ts`
11. `packages/config/test/config.unit.test.ts`

## 2. Findings
### 2.1 [P1] Remote API retries can overrun the declared timeout budget
- 位置: `packages/adapters/codex/src/codex-agent-adapter.ts:1133`
- 问题描述: `executeRemoteApiWithRetry()` retries every failure, including locally aborted timeout attempts, while reusing the full `timeoutMs` for each retry and adding backoff on top. The identical pattern is duplicated in `packages/adapters/claude-code/src/claude-code-agent-adapter.ts:1490`. That means a request configured for a `30s` timeout with `maxRetries=2` can now run for roughly `90s + backoff`, even though the new liveness contract says timeout budget must remain a real budget rather than a per-attempt hint.
- 影响: `remote_api` transports can violate route/surface timeout expectations and appear “alive” far longer than the configured fuse allows. This weakens the rollout’s timeout-governance guarantee and makes diagnostics misleading for long-running or hung provider calls.
- 建议: Enforce one total deadline across retries. Remaining budget should be recomputed after each attempt, and timeout-triggered aborts should not silently restart with a fresh full budget.

### 2.2 [P2] `credentialRef` is exported and validated but not actually supported
- 位置: `packages/config/src/schema-validator.ts:1130`
- 问题描述: The new remote-api config contract accepts `credentialRef`, and both adapters even label the probe health source as `credential_ref` when that field is present. But the runtime credential resolution in `packages/adapters/codex/src/codex-agent-adapter.ts:753-784` and `packages/adapters/claude-code/src/claude-code-agent-adapter.ts:1098-1129` still reads only `environment[credentialEnvVar]`, defaulting to provider env vars. So a config that validates as `credentialRef`-backed will still fail at runtime or accidentally fall back to unrelated env credentials.
- 影响: This is provider-binding truth drift: config/onboarding/diagnostics claim a supported credential source that the runtime cannot actually consume. Users can end up with passing schema validation but broken remote-api auth behavior, and health metadata becomes untrustworthy.
- 建议: Until `credentialRef` resolution lands for real, fail closed in schema/runtime instead of advertising it. Alternatively, implement actual `credentialRef` lookup before keeping the field in the shared contract and health-check output.

## 3. Notes
1. 这轮 working tree 同时混有 `project-036` closeout/registry 文档更新和 `project-037` runtime rollout；我把 review 聚焦到了真正改执行语义的 remote-api transport 代码面。
2. review 目录里已经有一个待复核的 `code_review_tk-492...`，但这次用户请求是新的 working tree CR，所以我单独生成了 `working-tree` 报告，没有去改旧报告生命周期。
3. 你 IDE 里贴的旧 finding `single-tool-minimal` 这轮不在当前 working tree 范围内，所以没有作为本轮 finding 复报。

## 4. Verification
1. `PATH="/opt/homebrew/bin:/Users/jimmydaddy/Library/pnpm:$PATH" pnpm run build`（通过）
2. `/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts packages/config/test/config.unit.test.ts packages/adapter-sdk/test/layered-health-check-runtime.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 5. 复核结论（2026-04-02）
1. 结论：接受并已修复 `2.1 [P1]` 与 `2.2 [P2]`，当前 working tree 在本 CR 范围内无剩余 pending finding。
2. `2.1 [P1]`：已在 `packages/adapters/codex/src/codex-agent-adapter.ts` 与 `packages/adapters/claude-code/src/claude-code-agent-adapter.ts` 将 remote-api retry 改为共享同一总 deadline；每次 retry 只拿剩余预算，`AbortError` 不再重启下一轮尝试。
3. `2.2 [P2]`：已在 `packages/config/src/schema-validator.ts` 对 `remoteApi.credentialRef` 明确 fail-closed，并在 Codex / Claude Code adapter runtime 上拒绝直接构造的 `credentialRef` 配置，避免 schema、runtime、health metadata 漂移。
4. 新增覆盖：`packages/config/test/config.unit.test.ts`、`packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`、`packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts` 已补充对应回归测试。

## 6. 修复执行记录（2026-04-02）
1. 在 Codex / Claude Code remote-api retry helper 中补入 absolute deadline、remaining budget 计算与 bounded retry backoff，并将 `AbortError` 视为终止条件，修复 declared timeout budget 被多次重置的问题。
2. 在 config schema 中保留 `credentialRef` 显式校验入口，但当前阶段统一返回 unsupported error；同时在 adapter runtime 中对绕过 schema 的直接构造场景继续 fail-closed。
3. 重新执行定向测试：`/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run packages/config/test/config.unit.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）。
4. 重新执行整库构建：`PATH="/opt/homebrew/bin:/Users/jimmydaddy/Library/pnpm:$PATH" /opt/homebrew/bin/node /opt/homebrew/lib/node_modules/npm/bin/npm-cli.js run build`（通过）。
