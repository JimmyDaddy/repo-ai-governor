# DA-117 artifact/report/presentation 模块抽离基线产物

- Status: active
- Date: 2026-03-24
- Owner: AI-Agent
- Artifact ID: `DA-117`
- Produced By: `TK-119`
- Scope: `project-011-cli-package-decomposition`

## 1. 目的

固化 `TK-119` 对 `apps/cli` 第二轮 package decomposition 的交付结果，明确 artifact I/O、review queue、replay/report shaping 与 experience/presentation 已从 `CliGovernanceRuntime` 中拆出为独立的 package-local 模块，并为后续 `TK-120/TK-121` 的 command executor / thin facade cutover 提供稳定输入。

## 2. 本轮交付

1. 新增 `apps/cli/src/runtime/artifacts/runtime-artifact-writer.ts`
   - 承接 text/json artifact I/O、execution report/replay artifact 持久化、run diagnostics trace 写入、replay diagnostics artifact 写入。
2. 新增 `apps/cli/src/runtime/artifacts/review-queue-runtime.ts`
   - 承接 review queue directory resolution 与 queued request discovery。
3. 新增 `apps/cli/src/runtime/presentation/command-experience-builder.ts`
   - 承接 command experience payload、run/replay progress rows、interaction prompts、diagnostic next actions。
4. 新增 `apps/cli/src/runtime/presentation/replay-explain-builder.ts`
   - 承接 execution report -> replay explain 构建与 replay source payload resolution。
5. 更新 `apps/cli/src/cli-governance-runtime.ts`
   - 由 facade 组合上述模块，不再直接持有 artifact I/O、review queue discovery、replay explain parsing、run/replay experience shaping。
   - 当前文件本轮净减少 `750` 行（`85` insertions / `835` deletions），当前长度为 `2502` 行。

## 3. 测试与验证覆盖

1. 新增 `apps/cli/test/runtime/runtime-artifact-writer.test.ts`
   - 直接覆盖 report/replay artifact 持久化与 replay diagnostics artifact 写入。
2. 新增 `apps/cli/test/runtime/review-queue-runtime.test.ts`
   - 直接覆盖 queued request discovery 与 request/result/legacy directory 过滤逻辑。
3. 新增 `apps/cli/test/runtime/command-experience-builder.test.ts`
   - 直接覆盖 run HITL presentation 与 replay diagnostics experience shaping。
4. 新增 `apps/cli/test/runtime/replay-explain-builder.test.ts`
   - 直接覆盖 execution report / replay explain source resolution。
5. 既有 `apps/cli/test/cli-governance-runtime.integration.test.ts` 保持通过
   - 确认 `run --replay`、`review`、`review-verify` 与 artifact/report/output contract 未因抽离回归。

## 4. 边界结论

1. artifact I/O、review queue 与 replay/report shaping 仍属于 CLI package-local runtime，不上提 shared。
2. `command-experience-builder` 当前同样保留在 CLI package-local presentation 边界，因为它直接绑定 CLI `experience` payload、stage/category 语义与 operator-facing next actions。
3. `CliGovernanceRuntime` 在本轮之后应继续避免承接新的 artifact/presentation 责任；`TK-120/TK-121` 应直接在 `commands/*` 与 facade 层继续 cutover。

## 5. 对 TK-120 / TK-121 的输入约束

1. `TK-120` 应直接消费 `DA-117`，在 command executor 抽离时复用现有 artifact/presentation 模块，而不是重新在 facade 内拼装 payload。
2. `TK-121` 在完成 run/review 命令 cutover 时，应保持 `runtime-artifact-writer`、`review-queue-runtime`、`command-experience-builder`、`replay-explain-builder` 的 package-local 归属，不得回填到 `apps/cli/src/cli-governance-runtime.ts`。
3. 只有当某段 helper 同时满足“跨 app/package 复用 + 语义稳定 + 不绑定 CLI command/result contract”时，后续才允许上提 shared。
