# DA-144 shared local orchestration service（CLI + desktop）契约基线

- Status: active
- Date: 2026-03-25
- Source Task: `TK-144`
- Project: `project-014-langgraph-orchestration-runtime-adoption`
- Sprint: `sprint-001-runtime-adoption-and-migration-baseline`

## 1. 交付摘要

`shared local orchestration service` 被固定为 `CLI` 与未来 `desktop client` 的统一执行入口。服务是唯一 runtime owner，负责执行生命周期、checkpoint、streaming event 与 HITL resume；CLI 与桌面端都只是 client/presenter，不直接持有 runtime 主状态。

## 2. 角色与状态所有权

### 2.1 Service Owner

1. 接收执行请求并生成 `execution_id`、复用/打开 `execution_session_id`。
2. 组装 `task-driven inputs -> process compiler -> runtime backend -> policy/HITL/audit/artifact` 主链。
3. 持有执行状态、checkpoint、pending HITL、recovery cursor 与 event stream。
4. 将正式结果回写到 workspace canonical sources。
5. 对 client 暴露稳定的 execution、streaming、HITL、recovery 查询契约。

### 2.2 CLI Client

1. 负责参数解析、TTY/locale/output mode 决策与命令级用户体验。
2. 将 `run/review/review-verify` 等命令映射到 service 请求。
3. 消费 execution event stream 并渲染为 `pretty/plain/json`。
4. 不直接拥有 runtime graph state、checkpoint 或 HITL queue。

### 2.3 Desktop Client

1. 负责 execution list、节点进度、artifact 链接、日志流和 HITL 交互面板。
2. 只能通过 service client / IPC bridge 调用服务。
3. 不直接依赖 `core-runtime*`、adapter/provider 实现，也不直接读取/写入 runtime checkpoint。
4. renderer/webview 只持有展示态和用户输入态，不持有 runtime 主状态。

## 3. 最小 API 契约

### 3.1 Execution API

1. `startExecution(request)`
   - 最小请求字段：`workspaceId`, `workspaceRoot`, `executionKind`, `taskId?`, `locale?`, `outputMode?`, `runtimeDebugOptions?`, `clientSurface`.
   - 最小响应字段：`executionId`, `executionSessionId`, `acceptedAt`, `status`, `checkpointCapable`, `eventStreamToken`.
2. `getExecution(executionId)`
   - 返回 execution 摘要、当前状态、最近阶段、policy/HITL 状态、artifact 摘要、checkpoint 可恢复性。

### 3.2 Streaming API

1. `subscribeExecution(executionId | eventStreamToken)`
2. 事件模型必须传输无关，至少支持：
   - `execution.started`
   - `stage.progress`
   - `stage.completed`
   - `artifact.ready`
   - `hitl.required`
   - `execution.interrupted`
   - `execution.completed`
   - `execution.failed`
3. event payload 至少回链：`executionId`, `executionSessionId`, `stageId?`, `status`, `timestamp`, `artifactId?`, `taskId?`, `projectId?`, `sprintId?`。

### 3.3 HITL Resume API

1. `submitHitlDecision(request)`
   - 最小请求字段：`executionId`, `executionSessionId`, `decision`, `resumeAction`, `reason?`, `constraints?`, `actor`.
   - 最小响应字段：`accepted`, `nextStatus`, `decisionReceiptArtifactPath?`。
2. 决策仍必须回写 receipt artifact 与 audit record；API 只是提交入口，不替代事实源。

### 3.4 Execution List / Recovery API

1. `listExecutions(filter?)`
   - 过滤维度至少支持：`workspaceId`, `status`, `taskId`, `projectId`, `sprintId`。
2. `recoverExecution(executionId)`
   - 仅对存在 checkpoint 且未终态的 execution 生效。
   - 返回 `recovered`、`checkpointSource`、`nextStatus`。
3. `cancelExecution(executionId)` 为可选扩展，但若实现，必须生成 audit event 与 session event。

## 4. 部署与进程模型约束

1. 服务默认以“每个 workspace 一个 runtime owner”的思路设计，避免跨 workspace 状态串扰。
2. Phase 0 可允许 `CLI` 以内嵌 service shell 的方式同进程运行，但必须遵守同一份 service contract；CLI 只是本地 client facade。
3. 面向桌面端的正式形态必须把服务放在 renderer 之外：
   - Electron：main process 或 worker
   - Tauri/其他无 Node renderer 形态：sidecar/local service
4. 是否长期驻留为 daemon 不是当前必须决策；但 service contract 必须同时支持“嵌入式短生命周期”和“独立长生命周期”两种宿主。
5. `legacy runtime` 不作为长期 service backend；若存在，只能在 cutover 验证窗口内作为临时 comparison backend。

## 5. 推荐包落位

1. `packages/core-orchestration-service`
   - internal service owner，负责执行编排、service request handling 与 runtime backend 选择。
2. `packages/core-runtime-langgraph`
   - graph runtime backend adapter，只处理 LangGraph 对接。
3. `packages/orchestration-service-client`
   - transport-neutral client DTO、request/response schema、event subscription contract。
4. `apps/cli`
   - 只保留命令解析、client 调用、输出渲染。
5. `apps/desktop`
   - 未来只依赖 `orchestration-service-client`、`reporting`、`shared`，不直接依赖 `core-runtime*`。

## 6. 与 canonical source 的边界

1. service 可缓存 execution state、checkpoint state、subscription cursor。
2. service 不得把下列内容内化为唯一事实源：
   - `current-context.md`
   - `TK-*`
   - `tasks/checklist.md`
   - `tasks/tasks.csv`
   - review lifecycle 文件
   - artifact registry 正式记录
3. service 完成一次正式状态迁移后，仍需通过现有 artifact/audit/review/ledger 写入链完成回写。

## 7. 实施约束

1. 首轮 service contract 只需要覆盖 `run` 主链及其内联 `review/HITL` 语义，不要求先支持所有命令。
2. client 与 service 之间的比较面应是稳定 DTO/event contract，不应把 `CliGovernanceRuntime` 的内部对象直接透传为 API。
3. streaming contract 必须能同时服务终端输出和桌面 UI，不允许一边依赖 ANSI 文本、一边另造平行事件协议。
4. 若未来引入独立 service process，workspace root、config path、memory provider、adapter config 的解析语义必须保持与 CLI 一致。

## 8. 消费约束

1. `TK-145` 必须把本产物视为 cutover parity harness 和 rollout 路径的正式 service 边界输入。
2. `TK-146` 必须基于本产物判断 sprint-002 是否仍保持“单一 runtime owner + client/presenter 分离”前提。
3. 后续实现不得让 `Desktop Client` 直接调用 `ProcessRuntimeEngine` 或 `core-runtime-langgraph`。

## 9. 证据路径

1. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
2. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
4. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/plan.md`
5. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-143-process-runtime-to-langgraph-adapter-boundary-and-state-contract-baseline.md`
6. `apps/cli/src/cli-governance-runtime.ts`
