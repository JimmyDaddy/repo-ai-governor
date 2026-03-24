# DA-113 CLI package decomposition 基线与依赖契约

- Status: active
- Date: 2026-03-24
- Owner: AI-Agent
- Artifact ID: `DA-113`
- Produced By: `TK-115`
- Scope: `project-011-cli-package-decomposition`

## 1. 目的

定义 project-011 的目标边界、分阶段执行顺序，以及与 `project-010` 的依赖关系，作为后续 CLI package 重构 task 的统一输入。

## 2. 为什么拆成独立 project

1. `apps/cli/src/cli-governance-runtime.ts` 已成为跨层级 God object，继续在 `project-010` 的业务主线上一边做主链能力一边大重构，会放大风险和 review 面。
2. `project-010` 关注的是 Stage 9 自动主链和交付闭环；`project-011` 关注的是 CLI package 架构分解。这两个目标相关，但不应混成一个执行流。
3. 因此 `project-011` 作为工程支撑主线存在，负责先把 CLI package 的 bounded context 和 facade 边界整理好，再把稳定输出回灌给 `project-010`。

## 3. 分阶段约束

1. sprint-001：runtime 支撑层抽离
   - `adapter verification/local probe`
   - `route/fallback/diagnostics builder`
2. sprint-002：artifact/presentation + command surface 抽离
   - `artifact/report/presentation`
   - `command executors`
   - `thin facade cutover`
3. sprint-003：package hardening + rollout alignment
   - `shared vs package-local`
   - `exports/tests/smoke`
   - `project-010` rollout backfeed

## 4. 与 project-010 的依赖契约

1. `project-010` sprint-002 及之后的 CLI 主链变更，应优先消费 project-011 的分解输出，而不是继续向 `apps/cli/src/cli-governance-runtime.ts` 追加新职责。
2. 在 project-011 未给出更高阶段产物前，至少应遵守本 artifact 的最小边界：
   - 新增 runtime 支撑逻辑优先进入 `apps/cli/src/runtime/*`
   - 新增 presentation / explain / experience shaping 优先进入 `apps/cli/src/runtime/presentation/*` 或等价模块
   - 新增 artifact 写入与 payload 构建优先进入 `apps/cli/src/runtime/artifacts/*`
   - 新增命令控制流优先进入 `apps/cli/src/commands/*`
3. 命中 `CS-027` 例外时，必须显式记录 `// god-object-exception: TK-xxx reason`，并在 active sprint 台账中说明分解回收计划。

## 5. shared 与 package-local 初始判定规则

1. 仅当逻辑满足“跨 app/package 复用 + 语义稳定 + 不绑定 CLI 交互上下文”时，才允许进入 shared。
2. 仅服务 `apps/cli` 的 orchestration、diagnostics、presentation、artifact 逻辑，应默认保留为 package-local。
3. 不允许为了缩小单文件体积而把 CLI 专属逻辑机械上提到 shared。

## 6. 使用方式

1. `TK-116` 与 `TK-117` 将本 artifact 作为唯一基线输入。
2. `project-010` 的 `TK-099` 起应回链本 artifact，并在实现时遵守上述边界约束。
3. 若 project-011 后续产出更高版本的 `DA-11x/12x` 约束，应以最新 artifact 取代本基线。
