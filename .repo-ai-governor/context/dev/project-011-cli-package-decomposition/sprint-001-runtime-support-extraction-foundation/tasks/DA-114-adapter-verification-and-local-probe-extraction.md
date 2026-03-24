# DA-114 adapter verification 与 local probe 抽离基线产物

- Status: active
- Date: 2026-03-24
- Owner: AI-Agent
- Artifact ID: `DA-114`
- Produced By: `TK-116`
- Scope: `project-011-cli-package-decomposition`

## 1. 目的

固化 `TK-116` 对 `apps/cli` runtime 支撑层的第一轮拆分结果，明确 `adapter verification` 与 `local probe` 已经从 `CliGovernanceRuntime` 中抽离为 package-local runtime，并为 `TK-117` 保留可复用边界。

## 2. 本轮交付

1. 新增 `apps/cli/src/runtime/local-model-probe-runtime.ts`
   - 承接本地命令探测、endpoint-backed Ollama 特判、local-model config completeness 校验和 availability merge。
2. 新增 `apps/cli/src/runtime/adapter-verification-runtime.ts`
   - 承接 tool snapshot 聚合、role evaluation、failure attribution、next-actions 汇总与 attribution summary 生成。
3. 新增 `apps/cli/src/types/interfaces/cli-adapter-verification.interface.ts`
   - 将 verification/probe 相关接口从 `cli-governance-runtime.ts` 私有定义迁移到 CLI 类型目录，满足类型治理约束。
4. `apps/cli/src/cli-governance-runtime.ts`
   - 退化为对新 runtime 的接线与少量 presentation helper，不再直接承载 verification/local probe 细节实现。

## 3. 测试与验证覆盖

1. 新增 `apps/cli/test/runtime/adapter-verification-runtime.test.ts`
   - 直接覆盖 endpoint-backed Ollama probe short-circuit。
   - 直接覆盖 `configuration_missing` attribution 和 next-action 聚合。
2. 既有 `apps/cli/test/cli-governance-runtime.integration.test.ts` 保持通过，确认 `connect/doctor/verify` 行为未因抽离发生回归。

## 4. 边界结论

1. `local probe` 仍然属于 CLI package-local runtime，不上提 shared。
2. `adapter verification` 继续依赖 `CliGovernanceRuntime` 提供的 protocol/surface helper；这部分将由 `TK-117` 继续下钻，处理 `route/fallback/diagnostics` 的共享边界。
3. 当前拆分没有改变 CLI 对外输出契约，属于 extraction-first refactor，而不是行为迁移窗口。

## 5. 对 TK-117 的输入约束

1. `TK-117` 应优先消费 `CliAdapterVerificationRuntime` 和 `CliLocalModelProbeRuntime`，避免把 route/fallback 逻辑再写回 `cli-governance-runtime.ts`。
2. 若后续需要抽出共享 surface/protocol helper，应优先保留在 `apps/cli/src/runtime/*`，仅在确认跨 package 复用后再考虑 shared。
3. 新增 diagnostics artifact builder 时，不应重新复制 failure attribution / next-actions 聚合逻辑。
