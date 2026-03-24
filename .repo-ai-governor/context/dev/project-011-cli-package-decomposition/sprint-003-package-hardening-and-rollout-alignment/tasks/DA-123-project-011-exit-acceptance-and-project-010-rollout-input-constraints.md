# DA-123 project-011 出口验收与 project-010 rollout 输入约束

- Status: active
- Date: 2026-03-24
- Owner: AI-Agent
- Artifact ID: `DA-123`
- Produced By: `TK-125`
- Scope: `project-011-cli-package-decomposition`

## 1. 目的

以滚动验收草案的方式汇总 `project-011` 的 CLI package decomposition 证据，并提前冻结 `project-010` 后续主链/rollout 对这些结果的消费边界。

## 2. 当前已成立的项目级证据

1. `DA-113`~`DA-116`
   - sprint-001 已完成 runtime support extraction foundation，并冻结了第一轮 handoff 约束。
2. `DA-117`、`DA-118`
   - artifact/presentation 与通用 command executor 已脱离 legacy god object。
3. `DA-120`
   - sprint-002 已形成出口验收冻结稿，并把 sprint-003 的 package hardening 输入约束固定下来。
4. `DA-121`
   - shared/package-local 边界与 exports 基线已经冻结；当前没有必须上提到 shared 的 `apps/cli` 模块，也没有需要新增的 public subpath exports。
5. `DA-122`
   - CLI package 的分层测试拓扑与 public entry smoke 已有第一轮验证证据。

## 3. 对 project-010 的正式输入约束

1. `project-010` 后续任务应消费 `DA-117`~`DA-123` 与 `project-011-cli-package-decomposition-completion-audit-summary.md` 的结构结论，而不是直接针对 `apps/cli/src/cli-governance-runtime.ts` 追加大块主链逻辑。
2. 若 `project-010` 需要增强 CLI runtime 能力，应优先落在既有边界：
   - `commands/*`
   - `runtime/*`
   - `runtime/artifacts/*`
   - `runtime/presentation/*`
3. `project-010` 不得将 CLI 专属命令/展示/诊断语义误上提到 `packages/shared`，除非另有单独 task 证明其跨包复用面与稳定契约。
4. `project-010` 若新增 CLI public entry 能力，必须同步补 root integration smoke，而不是只补 package 内部测试。
5. `project-010` sprint-002 入口应以 `DA-121/DA-122/DA-123 + project-011 completion audit summary` 作为正式 handoff，替代此前仅基于 `DA-113/DA-116` 的早期基线。

## 4. 最终结论

1. 当前状态：`accepted`
2. 结论：`project-011` 已完成 CLI package decomposition 的工程支撑主线，`DA-121/DA-122/DA-123` 与 completion audit summary 共同构成 `project-010` 的正式 rollout 输入约束。
3. 已完成回链：
   - `project-010 plan.md`
   - `project-010 sprint-002 plan.md`
   - `project-010 sprint-002 TK-099`
