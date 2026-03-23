# DA-099 本地模型适配契约与配置扩展基线产物

- Status: active
- Date: 2026-03-24
- Owner: AI-Agent
- Source Task: `TK-095`
- Version: `v1`

## 1. 目标

在不引入真实模型调用实现的前提下，完成本地模型（Ollama 类）接入的契约基线：统一 surface 常量、配置结构、schema 校验、CLI 路由接线与最小测试覆盖，为 `TK-096/TK-097` 提供单一输入基线。

## 2. 关键决策

1. 本轮只落地“契约与接线”，真实调用、重试容错与 fallback 行为延后至 `TK-096`。
2. 本地模型 surface 统一使用 `AdapterSurface.OLLAMA`，避免各包自行扩展字符串常量。
3. 在 `adapters.tools[]` 上新增 `localModel` 配置块，并要求 `toolId=ollama` 时必须提供；非本地模型工具禁止携带该字段。
4. `localModel.provider` 使用共享常量 `LocalModelProvider`（当前基线值为 `ollama`），确保 schema 与运行时语义一致。
5. 基线实现新增 `@repo-ai-governor/adapter-local-model` 包，先提供可验证的协议桩实现，保障路由与门禁链路可先行闭环。

## 3. 实施内容

1. 共享常量与导出：
   - `packages/shared/src/constants/adapter-runtime.constant.ts`
   - `packages/shared/src/constants/local-model-runtime.constant.ts`
   - `packages/shared/src/constants/index.ts`
   - `packages/shared/src/index.ts`
2. 配置契约与校验：
   - `packages/config/src/types/interfaces/governor.interface.ts`
   - `packages/config/src/types/interfaces/index.ts`
   - `packages/config/src/schema-validator.ts`
   - `packages/config/test/config.unit.test.ts`
3. 本地模型 adapter 基线包：
   - `packages/adapters/local-model/package.json`
   - `packages/adapters/local-model/src/index.ts`
   - `packages/adapters/local-model/src/local-model-agent-adapter.ts`
   - `packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts`
   - `packages/adapters/local-model/README.md`
4. CLI/runtime 接线：
   - `apps/cli/src/cli-governance-runtime.ts`（surface 注册、probe 分支、受控探测范围）
   - `apps/cli/test/cli-governance-runtime.integration.test.ts`
   - `apps/cli/package.json`
5. 构建与路径映射：
   - `scripts/build/copy-runtime-assets.js`
   - `tsconfig.json`

## 4. 验证证据

1. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
3. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
4. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
5. `pnpm -s vitest run packages/config/test/config.unit.test.ts packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 5. 消费约束

1. `TK-096` 必须复用本产物定义的 `localModel` 配置契约与 `AdapterSurface.OLLAMA` 语义，不得再次定义平行字段。
2. `TK-097` 的诊断与受限网络演练必须基于本产物中的 probe/route 接线，不得绕开配置/schema 验证链路。
3. 若新增本地模型 provider（非 ollama），必须先扩展 `LocalModelProvider` 与 `schema-validator`，再进入适配器实现层。
