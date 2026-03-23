# DA-095 角色级进度日志与人类友好交互展示产物

- Status: active
- Date: 2026-03-23
- Owner: AI-Agent
- Source Task: `TK-083`
- Version: `v1`

## 1. 目标

围绕 Stage 9 第二轮的可观测性目标，统一 CLI 命令的人类友好输出契约，确保 `role/stage/status` 进度、分层日志与交互提示在 `connect/doctor/verify/run/replay/review/review-verify` 路径上一致生效，并可回链审计与回放证据。

## 2. 关键决策

1. 进度模型与状态字典统一收敛到 `packages/shared`，以常量治理方式避免命令实现重复定义状态语义。
2. `run` 命令阶段分发改为统一走 `AgentRouteRunner`，让展示结果中的角色进度与真实 adapter 路由执行保持一致。
3. `connect/doctor/verify` 的适配器检查结果统一映射为 `experience` 输出，避免“检查通过但体验面板为空”的契约断裂。
4. 交互提示按语义类别输出（如 `policy_waiting`、`human_confirmation`、`environment_precondition`、`runtime_failure`），并在可阻断场景标注 `blocking=true`。

## 3. 实施内容

1. 共享层：
   - 新增 `ExecutionProgressStage/ExecutionProgressStatus/ExecutionInteractionCategory` 状态字典与标签常量；
   - 通过 `packages/shared/src/constants/index.ts` 与 `packages/shared/src/index.ts` 暴露统一契约。
2. CLI runtime 层：
   - `connect` 增加角色进度、交互提示与分层日志；
   - `doctor` 增加环境前置、权限提示与 adapter 探测进度回显；
   - `verify` 成功/告警路径增加 `experience.roleProgress`，修复重构后重复方法定义导致的体验丢失；
   - `run` 改为 adapter-route-runner 分发并输出 `handledBy/adapterSurface/selectedBy` 路由审计字段；
   - `review/review-verify/replay` 统一使用进度模型输出并补齐关键状态。
3. 配置层：
   - `ProfileResolver` 与 `resolveAdaptersRuntimeConfig` 采用“默认基线 + profile 增量覆盖”策略，保证 profile 仅覆盖 tools 时不破坏默认角色与路由基线。
4. 输出层：
   - `CliOutputPresenter` 在 `pretty/plain` 下统一消费 `experience`，提供摘要进度、next action 与详细日志输出。
5. 测试层：
   - 新增/更新 CLI 集成测试，覆盖 `connect` 与 `verify` 的进度输出契约；
   - 新增配置单测，覆盖 profile-only adapters override 场景。

## 4. 验证证据

1. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
3. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
4. `pnpm -s vitest run apps/cli/test/cli-governance-runtime.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts`（通过）
5. `pnpm run check`（通过）

## 5. 消费约束

1. `TK-084/TK-085/TK-086` 默认消费本产物定义的 `experience` 契约；后续黑盒 E2E 与发布门禁不得绕过该输出模型。
2. 后续扩展新命令或新阶段时，必须同步更新：
   - 共享状态常量；
   - CLI runtime 进度构建与交互提示；
   - `CliOutputPresenter` 渲染；
   - 集成测试断言。
3. 后续如变更 `run` 阶段分发实现，必须保持 `adapter-route-runner` 路由审计字段兼容，避免破坏回放与人类可读日志回链。
