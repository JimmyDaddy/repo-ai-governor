# Code Review: sprint-001-contract-and-routing-truth-cutover round 1

- Status: resolved
- Date: 2026-04-09
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: sprint scoped review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/remote-api-transport-and-provider-binding-seam.md`

## 1. Review Scope

1. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
2. `apps/cli/src/runtime/agent-projection-runtime.ts`
3. `packages/core-agent-projection/src/agent-projection-service.ts`
4. `packages/core-agent-projection/src/types/interfaces/agent-projection.interface.ts`
5. `packages/shared/src/constants/adapter-runtime.constant.ts`
6. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
7. `apps/cli/test/runtime/agent-projection-runtime.test.ts`
8. `apps/cli/test/runtime/adapter-verification-runtime.test.ts`
9. `packages/core-agent-projection/test/agent-projection-service.unit.test.ts`

## 2. Findings

### 2.1 [P2] Inferred remote_api rows dropped resolved vendor binding from liveness diagnostics

- 位置: `apps/cli/src/runtime/agent-onboarding-runtime.ts:343`
- 问题描述: 在本轮 pre-fix 实现里，`enabled_tools[]` 已经把 `remote_api` row 的 `vendor_binding_kind` materialize 为 canonical truth，但 `invoke_liveness_diagnostics.vendor_binding_kind` 仍直接读取 `configuredTool.remoteApi.vendorBinding`。当用户依赖“provider 唯一映射可省略 vendorBinding”时，analyze-first `connect` / onboarding surfaces 会同时产出“主 row 已解析 binding、liveness diagnostics 却还是 `null`”的自相矛盾 payload。
- 影响: consumer 若读取 `invoke_liveness_diagnostics` 做 presenter / diagnostics 聚合，会误以为 remote-api binding 仍未解析，破坏 sprint-001 试图建立的单一 transport/provider truth，也违反 runtime 进入 onboarding/liveness surface 后必须 materialize `vendor_binding_kind` 的 contract。
- 建议: 让 `invoke_liveness_diagnostics.vendor_binding_kind` 复用与 `enabled_tools[]` / `configured_remote_api` 相同的 `resolveConfiguredVendorBindingKind(...)` 解析路径，并补一条覆盖 `inferred_from_remote_api` 场景的回归测试。
- 规范依据: `agent-onboarding-contract.md` Required Constraints 11-12 与 Output Semantics 5-6；`agent-invoke-liveness-contract.md` Required Constraints 10；`remote-api-transport-and-provider-binding-seam.md` Decision 4。

## 3. Notes

1. 已多次调起 fresh reviewer sub-agent，但平台在等待窗口内未返回 final review；为避免主执行流阻塞，本轮改由 main-agent 在相同 scope 与验证基线下执行 fallback recheck，并保留 delegated-review timeout 这一操作性事实。
2. 除上述 contract drift 外，本轮主代理复核未再发现其他需要阻止 sprint-001 进入 closeout 的 actionable finding。

## 4. Verification

1. `pnpm run build`（通过）
2. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run check`（通过）

## 复核结论（2026-04-09）

- 整体结论：**认可**

### 逐条复核

1. `2.1 [P2] Inferred remote_api rows dropped resolved vendor binding from liveness diagnostics`
   - 判定：**认可**
   - 证据：`apps/cli/src/runtime/agent-onboarding-runtime.ts` 现已让 `invoke_liveness_diagnostics.vendor_binding_kind` 复用 `resolveConfiguredVendorBindingKind(...)`；`apps/cli/test/runtime/agent-onboarding-runtime.test.ts` 也新增了 `inferred_from_remote_api` 场景下 `vendor_binding_kind=OPENAI_RESPONSES` 的断言。
   - 处理：保留为 accepted finding，已在本轮修复窗口内处理并待最终 resolved 核验。

### 验证命令

1. `pnpm run build`（通过）
2. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run check`（通过）

## 修复执行记录（2026-04-09）

1. `2.1 [P2] Inferred remote_api rows dropped resolved vendor binding from liveness diagnostics`：已完成
   - 变更文件：
     - `apps/cli/src/runtime/agent-onboarding-runtime.ts`
     - `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run check`（通过）
   - 说明：`invoke_liveness_diagnostics.vendor_binding_kind` 已与 `enabled_tools[]` / `configured_remote_api` 使用同一条 resolved binding 解析路径；`inferred_from_remote_api` 场景新增回归断言，避免再次把 remote-api binding truth 降格成 `null`。
