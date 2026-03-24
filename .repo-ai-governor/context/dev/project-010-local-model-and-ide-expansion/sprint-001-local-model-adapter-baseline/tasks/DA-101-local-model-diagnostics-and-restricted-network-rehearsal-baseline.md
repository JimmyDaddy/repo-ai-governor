# DA-101 本地模型诊断校验与受限网络演练基线产物

- Status: active
- Date: 2026-03-24
- Owner: AI-Agent
- Source Task: `TK-097`
- Version: `v1`

## 1. 目标

将 `TK-096/DA-100` 已接通的真实本地模型执行面补齐到 `doctor/verify/run` 诊断链：形成稳定失败归因字段、显式 `safe_local` 边界说明、restricted-network CLI rehearsal 证据，以及可复跑的 resilience regression 场景。

## 2. 关键决策

1. 本地模型失败原因统一收敛为四类归因：`environment_precondition`、`configuration_missing`、`model_unavailable`、`capability_gap`，并写入 `connect/doctor/verify` 诊断产物与 role/tool checks。
2. `AdapterSurface.OLLAMA` 的配置完整性检查前置到本地探测前执行；当 `localModel.provider/endpoint/model` 缺失时，直接沉淀 `local_model_config_missing:*` reason 与补齐配置的 next action，而不是继续走模糊 probe 语义。
3. `doctor_diagnostics` 被提升为 `doctor` 命令统一产物；`doctor --fix` 的 `safe_local` 说明必须与最终 `checks/nextActions` 一起写入 artifact，即使未启用 `--adapters` 也不能缺席。
4. restricted-network rehearsal 通过 `runtimeDebugOptions.restrictedNetwork/restrictedReason/allowLocalFallback` 驱动；进入 local fallback 前必须对本地模型 surface 复用 `probe + capability evaluation`，不得比 standard mode 放宽资格规则。
5. resilience regression 新增 CLI 场景，要求 restricted-network local fallback takeover 可作为独立回归命令复跑，并区分 capability-compatible 成功路径与 capability-unsatisfied 失败路径。

## 3. 实施内容

1. CLI runtime 与诊断归因：
   - `apps/cli/src/cli-governance-runtime.ts`
   - `apps/cli/src/constants/cli-governance-runtime.constant.ts`
   - `apps/cli/src/types/interfaces/cli-runtime-debug.interface.ts`
   - `apps/cli/src/main.ts`
2. CLI i18n 与运行参数：
   - `packages/shared/src/i18n/locales/en-US.ts`
   - `packages/shared/src/i18n/locales/zh-cn.ts`
3. 测试与 resilience rehearsal：
   - `apps/cli/test/cli-governance-runtime.integration.test.ts`
   - `scripts/ci/run-resilience-regression.js`
4. 任务台账与 registry：
   - `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`
   - `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/plan.md`
   - `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/TK-097-local-model-diagnostics-and-restricted-network-rehearsal-baseline.md`
   - `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/checklist.md`
   - `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/tasks.csv`
   - `.repo-ai-governor/context/artifact-registry/artifacts.csv`

## 4. 验证证据

1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm -s vitest run packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm -s vitest run apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过）
5. `pnpm run test:resilience`（通过）
6. `pnpm run check`（通过）

## 5. 消费约束

1. 后续 `TK-098/TK-099` 不得再新增平行的 adapter failure bucket；诊断归因只能复用本产物冻结的四类字段。
2. restricted-network 演练若需要额外 debug flag，必须继续复用 `restrictedNetwork/restrictedReason/allowLocalFallback` 语义，而不是引入第二套 rehearsal 参数。
3. `doctor_diagnostics` 必须始终与终端结果共享同一份最终 `checks/nextActions`，后续增强不能再出现先落 artifact、后追加状态的漂移，也不能因未启用 adapters 而缺失。
4. resilience regression 中的 CLI restricted-network 场景应保持为独立可运行条目，避免被更宽泛的集成测试隐式覆盖后失去回归信号。
