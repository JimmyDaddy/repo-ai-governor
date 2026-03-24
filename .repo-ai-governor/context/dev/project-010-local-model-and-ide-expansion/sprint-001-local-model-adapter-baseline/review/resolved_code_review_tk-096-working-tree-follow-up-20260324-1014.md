# Code Review: TK-096 working tree follow-up

- Status: resolved
- Date: 2026-03-24
- Reviewer: AI-Agent
- Task: `TK-096`
- Review Type: implementation follow-up review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope

1. `packages/adapters/local-model/src/local-model-agent-adapter.ts`
2. `packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts`
3. `apps/cli/src/cli-governance-runtime.ts`
4. `apps/cli/test/cli-governance-runtime.integration.test.ts`
5. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/TK-096-ollama-like-adapter-and-route-fallback-baseline.md`
6. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/DA-099-local-model-adapter-contract-and-config-extension-baseline.md`
7. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/DA-100-ollama-like-adapter-and-route-fallback-baseline.md`

## 2. Findings

1. **[P1] local-model capability matrix overstates required role semantics**
   `LocalModelAgentAdapter` now reports `tool_calling`, `structured_output`, `streaming`, `confirmation_gate`, and `cancellation` as `SUPPORTED`, but the implementation still only performs a single `/api/generate` round-trip and returns raw `responseText`; `streamEvents()` emits synthetic status/completed rows, `requestConfirmation()` unconditionally approves, and `cancel()` only acknowledges without cancelling any in-flight invocation. Because `verify` and `run` consume the capability matrix for role eligibility (`apps/cli/src/main.ts` default roles and `apps/cli/src/cli-governance-runtime.ts` role evaluation / route dispatch), this change lets `ollama` fallback satisfy `planner/coder/reviewer/verifier` requirements on paper while those contracts are not actually implemented.

2. **[P2] CLI local probe incorrectly requires an `ollama` binary even when HTTP endpoint config is healthy**
   `DA-099/DA-100` freeze the local-model contract around `localModel.provider/endpoint/model`, and the adapter already probes readiness through `/api/tags`. But CLI verification merges that with a second hard gate, `ollama --version`, for `AdapterSurface.OLLAMA`. In deployments where the Ollama-compatible endpoint is reachable via container/sidecar/remote host but no local CLI is installed, the surface is forced to `UNAVAILABLE` and automatic fallback never activates despite a valid configured endpoint. The new integration tests mask this by overriding `adapterLocalProbeOverrides[OLLAMA]` to `AVAILABLE`, so the regression is currently uncovered.

## 3. Verification

1. `git status --short`
2. `git diff --stat`
3. `git diff -- apps/cli/src/cli-governance-runtime.ts`
4. `git diff -- apps/cli/test/cli-governance-runtime.integration.test.ts`
5. `git diff -- packages/adapters/local-model/src/local-model-agent-adapter.ts`
6. `git diff -- packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts`
7. `rg` / `nl -ba` static trace for capability, route selection, and local probe code paths

## 4. Recommendation

1. Downgrade unsupported local-model capabilities to `DEGRADED` or `UNSUPPORTED` until the adapter truly implements those semantics, and add one regression test proving `verify` blocks required roles when only Ollama fallback is available.
2. Remove the unconditional `ollama --version` gate from CLI readiness, or make it advisory-only when `localModel.endpoint` probe already succeeds; add one integration test covering endpoint-healthy plus command-missing.

## 5. Re-review Conclusion

1. **Finding 1: accepted and fixed.** `LocalModelAgentAdapter` capability matrix now advertises `tool_calling` and `structured_output` as `UNSUPPORTED`, `streaming` and `cancellation` as `DEGRADED`, and `confirmation_gate` as `UNSUPPORTED`; `requestConfirmation()` no longer auto-approves, and `cancel()` no longer claims guaranteed acknowledgement.
2. **Finding 2: accepted and fixed.** CLI local probe now trusts endpoint-backed `localModel{provider,endpoint,model}` health for `AdapterSurface.OLLAMA` instead of hard-blocking on `ollama --version`; command probing remains only for non-endpoint-backed cases.
3. `DA-100`、`TK-096`、`checklist.md` 与 `tasks.csv` 已同步更新，确保“自动追加 fallback candidate”与“默认 required role 仍受 capability gate 约束”的口径一致。

## 6. Fix Execution Record

1. `packages/adapters/local-model/src/local-model-agent-adapter.ts`
   - 收窄 capability matrix 到真实实现边界。
   - 将 confirmation/cancel 语义改为保守返回，避免误导上层治理链。
2. `apps/cli/src/cli-governance-runtime.ts`
   - 为命令探测加入可注入执行器，便于确定性回归测试。
   - 对 endpoint-backed `ollama` 工具行改成 endpoint-first probe 语义，不再要求本地二次命令门槛。
3. `packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts`
   - 新增 capability、confirmation、cancellation 的保守语义断言。
4. `apps/cli/test/cli-governance-runtime.integration.test.ts`
   - 新增 “verify 在仅剩 ollama fallback 时因 capability gate 被阻断” 回归。
   - 新增 “endpoint 健康但本地 `ollama` 命令缺失时仍保持 AVAILABLE” 回归。
   - 更新旧的 run fallback 假设，改为断言 runtime 进入 `failed` 而非误判为成功路由。
5. `packages/adapters/local-model/README.md` 与 `DA-100`
   - 补充当前 capability 口径与 endpoint-first probe 约束说明。

## 7. Post-fix Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm run build`
3. `pnpm -s vitest run packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`
4. `pnpm -s vitest run apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
