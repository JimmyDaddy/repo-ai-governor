# DA-152 sprint-002 出口验收与 sprint-003 输入约束

- Status: active
- Date: 2026-03-25
- Owner: AI-Agent
- Artifact ID: `DA-152`
- Produced By: `TK-152`
- Scope: `project-014-langgraph-orchestration-runtime-adoption`

## 1. 出口结论

`accept`

`project-014 / sprint-002-langgraph-phase0-spike-and-service-shell` 已满足当前 sprint 的退出条件。LangGraph Phase 0 的 graph backend、facade selector、短生命周期 parity harness、checkpoint/recovery 和 shared local orchestration service shell 已形成第一轮正式实现证据，可以作为 sprint-003 扩展 service-backed execution、cutover 扩围和 desktop client 接入约束的正式输入。

`project-014` 继续保持 `active`。`current-context` 暂不切换；待 sprint-003 正式拆解后，再将主执行流切到下一条实现面。

## 2. 验收范围

1. `core-runtime-langgraph` backend skeleton、compiled IR graph adapter 与 execution/interrupt/terminal contract。
2. `ProcessRuntimeFacade` backend selector、短生命周期 parity harness 与 backend unavailability fail-closed 行为。
3. file-backed 与 `sqlite-fs` checkpoint/recovery 路径，以及 shared local orchestration service shell 的最小 execution/HITL/recovery/event stream contract。
4. `run -> review -> review-verify -> HITL -> recovery` 的 LangGraph 最小主链接线与 CLI 正式输出面接线。
5. task ledger、artifact registry、sprint/project/master plan 与总 gate 的一致性。

## 3. 出口判定

1. Exit Criteria 1：通过
   - `DA-147` 已完成 `compiled IR -> graph` 的首轮适配，`core-runtime-langgraph` 已具备 graph node/edge/state skeleton。
   - `LangGraphRuntimeBackend` 已固化 execution event、interrupt kind 和 terminal status 的最小 contract。
2. Exit Criteria 2：通过
   - `DA-148` 已完成 facade backend selector 与短生命周期 parity harness。
   - `DA-149` 已完成 file-backed checkpoint 与 recovery smoke，保证恢复路径有正式比较基线。
3. Exit Criteria 3：通过
   - `DA-150` 已将 `run -> review -> review-verify -> HITL -> recovery` 最小主链接入 facade/LangGraph backend。
   - canonical source 继续由 workspace 文档与 artifact/audit 事实链持有，没有回流到 graph state。
4. Exit Criteria 4：通过
   - `DA-151` 已完成 `sqlite-fs` checkpoint、`orchestration-service-client` 和 `LocalOrchestrationServiceShell` 的第一轮收敛。
   - CLI 已改为通过 service shell 持有 checkpoint/recovery owner，且 `cli --help` 非运行时入口不再提前触发 `node:sqlite` warning。

## 4. 关键证据

1. `DA-147`：`core-runtime-langgraph` backend skeleton 与 compiled IR graph adapter 基线。
2. `DA-148`：facade backend selector 与 cutover parity harness 基线。
3. `DA-149`：file-backed checkpoint 与 recovery smoke 基线。
4. `DA-150`：LangGraph `run/review/HITL` 最小主链接线。
5. `DA-151`：`sqlite-fs` checkpointer 与 shared local orchestration service shell 收敛。

## 5. sprint-003 输入约束

1. `LangGraph` 继续是唯一目标 backend；`legacy runtime` 只允许作为短生命周期 parity/cutover comparison 基线，不恢复为长期并存产品模式。
2. `ProcessRuntimeFacade` 继续持有 `DSL -> IR -> policy -> audit -> ledger` 领域编排；`core-runtime-langgraph` 只承接 graph runtime/backend，不旁路 canonical source。
3. `shared local orchestration service` 继续是唯一 runtime owner；后续若扩到独立 daemon 或 desktop host，只能通过 `orchestration-service-client` 契约扩展。
4. sprint-003 优先扩大 service-backed recovery、execution API 和 desktop-client-ready transport 边界，不先扩张无关命令面。
5. `sqlite-fs` 保持默认 checkpoint 基线；任何非 `run` 命令入口都必须继续避免静态加载 `node:sqlite` 依赖，防止非运行时命令面出现副作用或 warning。
6. parity/cutover 判断继续只看 facade 对外产物、artifact/audit/review/ledger 和 CLI 正式输出，不以 backend 内部日志作为主判据。
7. 若后续引入 service 进程化或 IPC，必须保持 `event_stream_token`、HITL resume、checkpoint locator 与 execution summary 字段兼容。
8. sprint-003 启动前必须先完成正式 sprint 拆解，再切 `current-context`，避免在已完成的 sprint-002 上继续叠加实现工作。

## 6. 非阻断遗留项

1. 当前 `LocalOrchestrationServiceShell` 仍是 in-process shell，还不是独立本地服务或 daemon 形态。
2. `orchestration-service-client` 目前只固定了 transport-neutral contract，尚未落地 IPC/HTTP/desktop transport。
3. 短生命周期 parity harness 已具备，但还没有完成 cutover 扩围与最终移除 legacy comparison path 的正式决策。
4. 桌面端仍停留在 contract baseline，尚未开始独立 `apps/desktop` 或等价 client 实现。

## 7. 验证

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
5. `pnpm run check`
