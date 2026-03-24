# DA-116 sprint-001 出口验收与 sprint-002 输入约束

- Status: active
- Date: 2026-03-24
- Owner: AI-Agent
- Artifact ID: `DA-116`
- Produced By: `TK-118`
- Scope: `project-011-cli-package-decomposition`

## 1. 目的

汇总 sprint-001 runtime support extraction 的最终交付证据，形成统一出口验收结论，并冻结 `sprint-002-command-surface-and-facade-cutover` 的首版输入约束，避免后续命令/展示/产物抽离重新向 `apps/cli/src/cli-governance-runtime.ts` 回流职责。

## 2. sprint-001 证据快照（2026-03-24）

1. `TK-115 / DA-113`
   - 验收结果：通过。
   - 关键证据：
     - 已固定 `project-011` 与 `project-010` 的依赖契约。
     - 已明确 shared 与 package-local 的初始判定规则。
2. `TK-116 / DA-114`
   - 验收结果：通过。
   - 关键证据：
     - `adapter verification` 与 `local probe` 已从 `CliGovernanceRuntime` 抽离到 package-local runtime。
     - 已具备 runtime unit 与 CLI integration 覆盖。
3. `TK-117 / DA-115`
   - 验收结果：通过。
   - 关键证据：
     - `apps/cli/src/runtime/adapter-routing-runtime.ts` 已承接 surface/protocol construction、candidate surfaces 与 restricted fallback wiring。
     - `apps/cli/src/runtime/adapter-diagnostics-runtime.ts` 已承接 connect/doctor/verify diagnostics payload、progress 与 interaction prompt shaping。
     - `apps/cli/src/cli-governance-runtime.ts` 在本轮收敛中净减少 `527` 行，不再直接承载 route/fallback/adapter diagnostics builder 细节。

## 3. sprint-001 出口验收结论

1. 最终结论：`accept`。
2. 通过依据：
   - `DA-113`~`DA-116` 已形成可检索产物，并完成台账同步。
   - `adapter verification/local probe` 与 `route/fallback/diagnostics builder` 的目标归属边界已由代码与文档同时确认。
   - `TK-119` 的启动输入已明确绑定到 `DA-116`，后续 sprint-002 不再默认把新职责挤回 legacy facade。
3. 残余风险：
   - `apps/cli/src/cli-governance-runtime.ts` 当前仍有 `3253` 行，sprint-001 只完成 runtime support extraction；artifact/report/presentation 和 command surface 的抽离仍需 sprint-002 / sprint-003 继续收口。

## 4. sprint-002 输入约束总览

1. `TK-119` 必须直接消费 `DA-115` 与 `DA-116`，继续抽离 diagnostics trace、report/replay、experience shaping 等 artifact/presentation 责任。
2. `artifact/report/presentation` 抽离应优先落到 `apps/cli/src/runtime/artifacts/*`、`apps/cli/src/runtime/presentation/*` 或等价 package-local bounded context；只有满足“跨 app/package 复用 + 语义稳定 + 不绑定 CLI 交互上下文”时，才允许上提 shared。
3. `TK-120` 与 `TK-121` 可以依赖 package-local runtime 模块进行装配，但不得重新把 runtime support 细节折返塞回 facade。
4. `project-010` 的后续 CLI 主链改动必须优先消费 project-011 已建立的边界，而不是继续在 legacy runtime 中叠加 route/fallback/diagnostics 责任。
5. 任何临时无法避免的 legacy 触碰都必须遵守 `CS-027`，并写明 `// god-object-exception: TK-xxx reason` 与回收计划。

## 5. 验证

1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm -s vitest run apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm -s vitest run apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
7. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
8. `pnpm run check`（通过）
