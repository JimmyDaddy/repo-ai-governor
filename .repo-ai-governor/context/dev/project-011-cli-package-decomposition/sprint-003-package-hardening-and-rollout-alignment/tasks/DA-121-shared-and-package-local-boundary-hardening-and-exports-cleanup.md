# DA-121 shared/package-local 边界收敛与 exports 清理

- Status: active
- Date: 2026-03-24
- Owner: AI-Agent
- Artifact ID: `DA-121`
- Produced By: `TK-123`
- Scope: `project-011-cli-package-decomposition`

## 1. 目的

基于 `project-011` 前两轮拆分结果，固化 `apps/cli` 当前阶段的 shared/package-local 边界判断与 package exports 基线，避免为了“继续拆分”而把 CLI 专属语义误上提到 shared。

## 2. 输入基线

1. `.repo-ai-governor/draft/cli-governance-runtime-decomposition-plan.md`
2. `DA-117` artifact/report/presentation 抽离结果
3. `DA-118` command executor 与 entry registry 基线
4. `DA-120` sprint-002 出口验收与 sprint-003 输入约束冻结稿
5. `apps/cli/package.json` 当前仅导出根入口 `@repo-ai-governor/cli`

## 3. 当前边界审计结论

1. `apps/cli` 当前拆分出的 `commands/*`、`runtime/*`、`runtime/artifacts/*` 与 `runtime/presentation/*` 仍然属于 CLI package-local 边界。
   - 这些模块直接承载 CLI 命令分发、TTY/输出上下文、CLI 诊断结构、artifact 路径与本地 fallback 语义。
   - 它们的职责虽然已经从 `CliGovernanceRuntime` 中拆出，但并未形成稳定的跨 app/package 复用契约。
2. `CliGovernanceRuntime`、`CliOutputPresenter` 与 `IdeCommandWrapper` 继续保留在 `apps/cli`，不进入 shared。
   - 这三类模块仍直接锚定 `CLI & API Entry Layer`，并携带 CLI/IDE surface 特有输入输出语义。
3. `apps/cli/src/types/*` 与 `apps/cli/src/constants/*` 当前保持 package-local。
   - 这些类型与常量主要描述 CLI runtime context、command result、presentation payload 与 wrapper invocation。
   - 它们并非 shared foundation 层的通用语义，不应为了减少 import 层级而提前上提。
4. 继续留在 shared 的只能是稳定跨包复用能力。
   - 例如 i18n runtime、标准化错误、通用枚举与工具级配置常量，仍以 `packages/shared` 或其他核心包为 canonical source。
   - promotion 的最低条件应包括：跨两个及以上 app/package 复用、与 CLI command/presentation 语义解耦、能形成独立稳定契约。

## 4. exports 清理结论

1. `apps/cli/package.json` 继续仅暴露根导出 `"."`。
   - 当前 public surface 只承载 CLI 主入口与 IDE wrapper 相关导出，不新增 `commands/*`、`runtime/*`、`types/*` 或 `constants/*` 的 subpath exports。
2. `commands/*`、`runtime/*`、`types/*` 的 barrel/index 仅服务 package-local 组织，不构成 public API 承诺。
3. 测试可以通过 workspace 内相对路径命中新模块，但这不应反向推动 package public surface 扩张。
4. 现阶段没有必要为了“exports cleanup”改造为多 subpath package；这会在 CLI package 仍处于职责收敛期时过早冻结内部结构。

## 5. 当前需要避免的错误动作

1. 不要把 `adapter-routing-runtime`、`adapter-verification-runtime`、`runtime-artifact-writer`、`command-experience-builder` 等 CLI 专属模块直接迁入 `packages/shared`。
2. 不要因为 `apps/cli/src/types/index.ts` 已形成聚合导出，就把 CLI result/payload 类型误判为共享契约。
3. 不要为了测试便利新增 `@repo-ai-governor/cli/runtime/*` 一类的对外 exports。

## 6. 对 TK-124 / TK-125 的输入约束

1. `TK-124` 应优先验证 package-local 边界下的 smoke/regression，而不是以新增 public exports 作为“完成标志”。
2. `TK-125` 在向 `project-010` 回灌时，应强调“消费 project-011 的结构边界结论”，而不是消费 `apps/cli` 的内部模块路径。
3. 若后续确有模块需要上提到 shared，必须在对应 task card 中单独证明其复用面与稳定契约，再执行 promotion。

## 7. 最终结论

1. 当前状态：`boundary_finalized`
2. 结论：本轮未发现必须立刻迁入 shared 的 `apps/cli` 模块，也未发现需要新增的 package subpath exports；该边界已被 `DA-122/DA-123` 的测试与 rollout 约束继续消费。
3. 后续动作：若未来确有 promotion 需要，必须以独立 task 证明其跨包复用面与稳定契约，不得直接复用本轮基线作为默认上提前提。
