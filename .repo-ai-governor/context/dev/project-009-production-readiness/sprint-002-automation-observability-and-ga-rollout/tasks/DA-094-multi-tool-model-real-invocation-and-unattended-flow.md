# DA-094 多工具/多模型真实调用与无人值守自动链路产物

- Status: active
- Date: 2026-03-23
- Owner: AI-Agent
- Source Task: `TK-082`
- Version: `v1`

## 1. 目标

完成 `connect -> doctor --adapters -> verify --adapters` 主路径落地，并在不破坏现有 `plan/run/review/review-verify` 链路的前提下收敛多工具/多模型路由、适配器探测、safe_local 自动修复边界与可选台账回填机制。

## 2. 关键决策

1. 阶段 A 直接引入 `adapters/routing/tools` 配置契约，并允许“同一工具绑定多个角色”。
2. `connect` 默认仅写 diagnostics artifact；仅在 `--record-ledger --task-id` 显式参数下写入 ledger-backfill artifact。
3. `doctor --adapters --fix` 的自动修复严格限制在 `safe_local`：目录创建、模板配置写入、本地可写路径修复；登录/鉴权/代理与权限升级仅输出 `nextAction`。
4. `verify --adapters` 统一输出 `pass/warn/fail`：
   - `pass`：required 角色均具备可用 primary（或可接受能力）；
   - `warn`：存在降级能力或 fallback 选路但仍可闭环；
   - `fail`：required 角色无可用 surface 或存在闭环能力缺口。
5. 运行时 dist 打包新增适配器链路依赖镜像（`adapter-sdk` + 三个 adapters），避免 clean-room 运行时报缺包。

## 3. 实施内容

1. 配置层：
   - `packages/config` 新增 `adapters` 类型契约与 schema 校验；
   - `ProfileResolver` 新增 `adapters` profile merge（roles/routing/tools）。
2. 共享常量层：
   - `packages/shared/src/constants/adapter-runtime.constant.ts` 增加 `AdapterSurface`、`AdapterAvailability`。
3. CLI 命令层：
   - 新增 `connect`、`verify` 命令；
   - 新增参数：`--adapters`、`--fix`、`--record-ledger`、`--task-id`；
   - i18n 同步中英文命令与参数文案。
4. CLI runtime 层：
   - `connect` 生成诊断产物并按显式参数生成 ledger-backfill；
   - `doctor --adapters` 增加适配器探测与 safe_local 修复；
   - `verify --adapters` 增加角色/工具矩阵判定并在 `fail` 时阻断。
5. 发布打包层：
   - `scripts/build/copy-runtime-assets.js` 新增适配器相关 workspace 包镜像，保证 dist 自包含可运行。
6. 测试层：
   - 补充 `apps/cli` 集成测试（connect/verify 成功与失败路径、help 命令项）；
   - 补充 `packages/config` adapters profile merge 单测。

## 4. 验证证据

1. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
3. `pnpm run check`（通过）
4. `pnpm run test:packages -- apps/cli/test --maxWorkers=1 --maxConcurrency=1`（通过）
5. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过）
6. `pnpm run help`（通过，含 `connect/verify` 与新增参数）

## 5. 消费约束

1. `TK-083/TK-084/TK-085/TK-086` 默认消费本产物中的命令与判定语义，不得回退到无 `adapters/routing` 校验的流程。
2. 后续新增 adapter surface 时，必须同时更新：
   - `AdapterSurface` 常量；
   - CLI runtime 探测映射；
   - `copy-runtime-assets` 运行时镜像清单；
   - `verify` 判定与集成测试。
3. `--record-ledger` 行为保持显式触发；禁止恢复为默认高频回写任务台账。
