# DA-146 sprint-001 出口验收与 sprint-002 输入约束

- Status: active
- Date: 2026-03-25
- Owner: AI-Agent
- Artifact ID: `DA-146`
- Produced By: `TK-146`
- Scope: `project-014-langgraph-orchestration-runtime-adoption`

## 1. 出口结论

`accept`

`project-014 / sprint-001-runtime-adoption-and-migration-baseline` 已满足当前 sprint 的退出条件。LangGraph adoption 决策、runtime adapter 边界、shared local orchestration service 契约和 Phase 0 spike / cutover parity / checkpointer 路径都已形成正式基线，可以作为 sprint-002 实装与进一步分解的正式输入。

`project-014` 继续保持 `active`，但后续工作应切换到 sprint-002 的实现与服务化收敛，不再回到 sprint-001 追加边界决策。

## 2. 验收范围

1. `LangGraph` 采用决策并入 triad、brief、overall technical solution、architecture 和 master execution plan 的正式事实链。
2. `Process Runtime (Facade) -> LangGraph Runtime Adapter` 的职责边界、state contract、checkpointer 准入/禁入规则与 canonical source 约束。
3. `shared local orchestration service` 作为 `CLI + future desktop` 统一执行面的 ownership、API contract、部署形态与 package 落位约束。
4. Phase 0 最小闭环、短生命周期 cutover parity harness、file-backed -> sqlite-fs -> service recovery 路径与 rollout 顺序。
5. task ledger、artifact registry、sprint plan 状态和总 gate 的一致性。

## 3. 出口判定

1. Exit Criteria 1：通过
   - `DA-142` 已将 `LangGraph` 采用决策正式并入 triad/master plan，并切换 `project-014` 为 runtime modernization 主执行流。
   - draft 方案已降级为 traceback/background，不再作为 downstream formal input。
2. Exit Criteria 2：通过
   - `DA-143` 已冻结 facade、LangGraph adapter、checkpointer 和 side-effect services 的边界。
   - `execution_id / execution_session_id / task / stream / artifact` 的状态映射与 checkpoint 准入限制已经明确，保证 graph state 不升格为新的 canonical source。
3. Exit Criteria 3：通过
   - `DA-144` 已明确 shared local orchestration service 是唯一 runtime owner，`CLI` 与未来 `desktop client` 只作为 client/presenter。
   - execution、streaming、HITL、recovery 的最小 API 契约与部署约束已经固定。
4. Exit Criteria 4：通过
   - `DA-145` 已冻结 Phase 0 最小闭环、短生命周期 cutover parity harness、checkpoint 路线和 rollout 顺序。
   - sprint-002 的核心实现焦点已经从“是否采用/如何分层”收敛为“按既定边界实施 backend、service shell 和 recovery”。

## 4. 关键证据

1. `DA-142`：LangGraph 采用决策、triad/master plan 同步与 project-014 启动基线。
2. `DA-143`：runtime facade、LangGraph adapter、state contract 与 canonical source 约束基线。
3. `DA-144`：shared local orchestration service、CLI/desktop contract 与单一 runtime owner 基线。
4. `DA-145`：Phase 0 最小闭环、cutover parity harness、checkpoint 路径与 rollout 计划基线。

## 5. sprint-002 输入约束

1. 默认目标 backend 只有 `LangGraph`；`legacy runtime` 仅允许作为短生命周期 comparison harness，不得重新升级为长期并存架构。
2. `Process Runtime Facade` 继续持有 `DSL -> IR -> policy -> audit -> ledger` 领域编排；`packages/core-runtime-langgraph` 只承担 graph runtime adapter/backend 责任。
3. `shared local orchestration service` 必须继续作为唯一 runtime owner；`CLI` 与未来 `desktop client` 只能通过稳定 service contract 消费执行、streaming、HITL 和 recovery。
4. sprint-002 的首轮实现聚焦 `run -> review -> review-verify -> HITL -> recovery` 最小主链，不先扩张到所有命令。
5. checkpointer 路线固定为 `file-backed -> sqlite-fs -> service-backed recovery`；checkpoint 中不得写入 `current-context/tasks/review/artifacts/audit` 的 canonical 正文。
6. parity、recovery 与 rollout 结论必须从 `pretty/plain/json`、artifact、audit、review、ledger 这些正式产物判断，不以 backend 内部日志为主。
7. 目标包落位继续保持：
   - `packages/core-runtime-langgraph`
   - `packages/core-orchestration-service`
   - `packages/orchestration-service-client`
8. sprint-002 启动前必须显式完成 sprint 拆解和 current-context 切换，避免继续在已完成的 sprint-001 上叠加实现工作。

## 6. 非阻断遗留项

1. `core-runtime-langgraph`、`core-orchestration-service` 和 `orchestration-service-client` 目前仍是目标落位，尚未开始正式代码实现。
2. 桌面端当前只有 contract baseline，还没有独立 `apps/desktop` 实现；这不阻断 sprint-002 的 runtime/service 主链落地。
3. 需要在 sprint-002 中补齐 facade selector、file-backed checkpoint smoke、sqlite-fs recovery、service shell 和最小闭环 parity 验证。

## 7. 验证

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
5. `pnpm run check`
