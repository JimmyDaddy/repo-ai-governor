# DA-100 Ollama 类 adapter 与 route fallback 基线产物

- Status: active
- Date: 2026-03-24
- Owner: AI-Agent
- Source Task: `TK-096`
- Version: `v1`

## 1. 目标

将 `DA-099` 的本地模型契约基线升级为可执行实现：支持真实 Ollama 类 `probe/invoke`、timeout/retry、远端 surface 不可用时自动回退到 `ollama`，并让 CLI 诊断输出可直接解释本地模型故障原因。

## 2. 关键决策

1. 真实本地模型调用沿用 `DA-099` 已冻结的 `AdapterSurface.OLLAMA` 与 `localModel{provider,endpoint,model,requestTimeoutMs,maxRetries}` 契约，不新增平行配置字段。
2. `LocalModelAgentAdapter` 在存在 `localModel` 配置时走真实 HTTP 路径：`/api/tags` 用于 probe，`/api/generate` 用于最小 invoke；未提供配置时保留 baseline echo 语义，兼容旧测试夹具。
3. `run` 路由与 `connect/doctor/verify` 角色评估统一自动追加 `ollama` 作为最后一跳 fallback candidate，但仅在工具配置中显式启用本地模型时生效；默认 required role 仍受 capability gate 约束，不因 fallback candidate 存在而越过 `tool_calling` / `structured_output` 缺口。
4. restricted-network fallback handler 也改为委托真实本地模型适配器，而不是只返回占位输出，为 `TK-097` 的 restricted rehearsal 保留同一执行面。
5. endpoint-backed 本地模型 probe 以 HTTP 健康与模型存在性为准，不再把本地 `ollama --version` 作为先决阻断条件；命令探测只在未配置 endpoint-backed localModel 时使用。
6. 本地模型故障语义统一沉淀为 `local_model_model_missing`、`local_model_endpoint_unreachable`、`local_model_probe_invalid_response` 三类 reason，并在 CLI 中提供人类可读文案与 next actions。

## 3. 实施内容

1. 本地模型适配器实现：
   - `packages/adapters/local-model/src/local-model-agent-adapter.ts`
   - `packages/adapters/local-model/package.json`
   - `packages/adapters/local-model/README.md`
2. 本地模型适配器测试：
   - `packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts`
3. CLI/runtime 路由与诊断接线：
   - `apps/cli/src/cli-governance-runtime.ts`
   - `apps/cli/test/cli-governance-runtime.integration.test.ts`
4. 任务台账与 artifact registry：
   - `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`
   - `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/plan.md`
   - `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/TK-096-ollama-like-adapter-and-route-fallback-baseline.md`
   - `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/checklist.md`
   - `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/tasks.csv`
   - `.repo-ai-governor/context/artifact-registry/artifacts.csv`

## 4. 验证证据

1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm run test:packages -- packages/adapters --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm -s vitest run apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run check`（通过）

## 5. 消费约束

1. `TK-097` 必须复用本产物沉淀的 `local_model_*` reason 与 CLI route semantics，不得再定义第二套本地模型诊断词汇。
2. restricted network 演练优先走本任务已经接通的真实本地模型 fallback handler，不再回退到占位输出实现。
3. 在本地模型真正具备 `tool_calling` / `structured_output` 语义前，不得把默认 `verify/run` required role 解释为已被 `ollama` fallback 自动满足。
4. 若后续扩展非 Ollama provider，必须先扩展 provider 常量和真实实现，再修改自动 fallback 注入逻辑。
