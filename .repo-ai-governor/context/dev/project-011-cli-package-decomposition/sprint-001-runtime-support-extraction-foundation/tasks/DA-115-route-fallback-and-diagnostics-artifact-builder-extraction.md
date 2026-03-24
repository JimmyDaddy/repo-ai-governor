# DA-115 route fallback 与 diagnostics artifact builder 抽离基线产物

- Status: active
- Date: 2026-03-24
- Owner: AI-Agent
- Artifact ID: `DA-115`
- Produced By: `TK-117`
- Scope: `project-011-cli-package-decomposition`

## 1. 目的

固化 `TK-117` 对 `apps/cli` runtime 支撑层第二轮拆分结果，明确 `route selection / restricted fallback` 与 `connect/doctor/verify diagnostics shaping` 已从 `CliGovernanceRuntime` 中抽离为 package-local runtime，并为 sprint-002 的 artifact/presentation 与 facade cutover 提供稳定输入。

## 2. 本轮交付

1. 新增 `apps/cli/src/runtime/adapter-routing-runtime.ts`
   - 承接 surface/protocol construction、tracked surfaces、candidate surface resolution、restricted-network local fallback wiring。
2. 新增 `apps/cli/src/runtime/adapter-diagnostics-runtime.ts`
   - 承接 adapter verification artifact payload、doctor `safe_local` boundary payload、tool/role detail shaping、role progress 与 interaction prompts。
3. `apps/cli/src/runtime/adapter-verification-runtime.ts`
   - 改为消费 `CliAdapterRoutingRuntime`，不再依赖 `CliGovernanceRuntime` 提供 protocol/surface helper。
4. `apps/cli/src/cli-governance-runtime.ts`
   - 将 route/fallback 与 adapter diagnostics builder 迁出为 runtime 组合，当前文件在本轮变更中净减少 `527` 行（`67` insertions / `594` deletions），当前文件长度为 `3253` 行。

## 3. 测试与验证覆盖

1. 新增 `apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts`
   - 直接覆盖 probe detail humanization、`safe_local` boundary payload、verification payload/progress/prompt shaping。
2. 更新 `apps/cli/test/runtime/adapter-verification-runtime.test.ts`
   - 验证 extracted verification runtime 改为通过 `CliAdapterRoutingRuntime` 供给 protocol/surface lookup 后仍保持语义一致。
3. 既有 `apps/cli/test/cli-governance-runtime.integration.test.ts` 保持通过
   - 确认 `connect/doctor/verify` 诊断产物和 restricted-network fallback 行为未因抽离发生回归。

## 4. 边界结论

1. `route selection / restricted fallback` 属于 CLI package-local runtime，不上提 shared。
2. `adapter diagnostics shaping` 目前同样属于 CLI package-local runtime，因为它仍绑定 CLI 交互上下文、artifact path 和 operator-facing output semantics。
3. sprint-002 不得再把新的 route/fallback/adapter diagnostics 责任写回 `apps/cli/src/cli-governance-runtime.ts`；下一轮应继续抽离 `diagnostics trace / report / replay / experience shaping / command executors`。

## 5. 对 TK-118 / sprint-002 的输入约束

1. `TK-118` 应将本 artifact 作为 sprint-001 出口验收的关键证据之一，并给出最终 `accept/block` 结论。
2. `TK-119` 应直接消费 `DA-115` 与 `DA-116`，继续清理 diagnostics/report/replay/experience shaping，而不是回退到 facade 内实现。
3. 仅当能力满足“跨 app/package 复用 + 语义稳定 + 不绑定 CLI 交互上下文”时，后续抽离产物才允许上提 shared。
