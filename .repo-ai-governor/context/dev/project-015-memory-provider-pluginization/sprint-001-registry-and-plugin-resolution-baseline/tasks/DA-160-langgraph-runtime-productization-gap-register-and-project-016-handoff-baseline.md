# DA-160 LangGraph runtime productization residual gap register 与 project-016 handoff baseline

- Status: active
- Date: 2026-03-26
- Producer Task: `TK-160`
- Scope: `project-014` completion clarification + planned `project-016` bootstrap

## 1. 结论

`project-014-langgraph-orchestration-runtime-adoption` 完成的是 LangGraph runtime modernization 的第一阶段，而不是 LangGraph full productization。当前仓库已经具备：

1. `Process Runtime Facade -> LangGraph-oriented backend shell` 的 adoption baseline。
2. `shared local orchestration service`、service-backed execution 与 transport-neutral / desktop-ready DTO contract。
3. `run/review/review-verify/HITL/recovery` 经由 service client 的 cutover 与 parity 证据。

但以下 residual gaps 仍然存在，必须由独立 follow-up project 继续收口。

## 2. Residual Gap Register

| gap_id | 差距项 | 当前信号 | 完成判据 | 建议承接 |
|---|---|---|---|---|
| LG-01 | 社区 LangGraph vendor adoption 尚未完成 | `packages/core-runtime-langgraph/package.json` 当前没有社区 LangGraph 依赖；包内实现仍是 self-hosted adapter shell | 明确接入真实社区 LangGraph vendor runtime，或正式改名为中性 graph backend 并修订 triad/plan 口径 | `project-016 / sprint-001` |
| LG-02 | graph-first orchestration engine 仍是 skeleton | `LangGraphRuntimeBackend` 当前核心仍是 `prepare()`，缺少完整 graph scheduling / execution semantics | LangGraph backend 能稳定承载 graph-first execution，而不是只生成 graph plan 与 lifecycle envelope | `project-016 / sprint-001` |
| LG-03 | migration selector / parity 仍带过渡期语义 | 当前 `legacy runtime` 仍作为 comparison harness 存在，vendor/runtime truthfulness 仍停留在迁移期口径 | 完成长期单一 graph-first runtime 收敛，移除不再需要的 dual-runtime migration scaffolding | `project-016 / sprint-001` |
| LG-04 | `sidecar + ipc` service host 未产品化 | 当前只有 host/transport seam 与 smoke descriptor，尚无正式 sidecar 进程、IPC 协议与安装/健康/生命周期治理 | 提供正式 sidecar host、IPC transport、health/restart/install/release baseline | `project-016 / sprint-001` |
| LG-05 | desktop execution surface 仍停留在 contract seam | 现有 desktop-ready DTO 只是消费契约，尚无真实 desktop execution transport/product flow | 至少 1 条 desktop execution path 可通过 sidecar/client contract 正式运行并受治理门禁保护 | `project-016 / sprint-001` |
| LG-06 | service host packaging / ops / release 尚未完成 | 当前没有围绕 orchestration sidecar 的 packaging、distribution、smoke、release gate | sidecar/service host 的本地分发、版本兼容、smoke、release gate 形成正式基线 | `project-016 / sprint-001` |

## 3. Why `project-014` Still Counts As Completed

`project-014` 的完成态只对它自己的 DoD 负责。它承诺的是：

1. adoption decision、boundary、state contract 与 rollout 路径冻结；
2. Phase 0 backend、checkpoint/recovery、service-backed execution 基线；
3. CLI 与未来 desktop 共用同一 orchestration service/client seam。

它没有承诺：

1. 社区 LangGraph vendor runtime 已完整接入；
2. sidecar / IPC / desktop host 已产品化；
3. 完整 graph-first engine 已替代所有过渡期 migration scaffolding。

因此正确口径是：`project-014 completed first-phase`，而不是 `LangGraph full productization completed`。

## 4. Project-016 Handoff Proposal

建议新建 `project-016-langgraph-runtime-productization`，专门收口上表 residual gaps。

### 4.1 建议目标

1. 将 `core-runtime-langgraph` 从 adoption shell 提升为 truthful vendor-backed runtime adapter。
2. 完成 graph-first orchestration engine 的正式执行面，而不是仅保留 skeleton / prepare-first 语义。
3. 将 `sidecar + ipc` 收敛为默认推荐的本地 service host，并为 desktop execution surface 提供正式入口。

### 4.2 建议 Sprint-001

1. `TK-161` project-016 启动与 LangGraph productization 重排
2. `TK-162` 社区 LangGraph vendor adapter 与 package truthfulness 基线
3. `TK-163` graph-first execution semantics 与 selector/cutover hardening
4. `TK-164` `sidecar + ipc` orchestration host 与 transport 基线
5. `TK-165` desktop execution / service ops / release baseline
6. `TK-166` sprint-001 出口验收与后续 rollout 输入约束

## 5. Recommended Constraint

在 `project-016` 完成前，后续文档和对外沟通必须使用以下口径：

1. `project-014` 已完成 LangGraph adoption 的第一阶段。
2. LangGraph full productization 尚未完成。
3. `sidecar + ipc` 是唯一推荐的下一步 host/transport；`daemon + http` 不进入当前产品化承诺。

## 6. Formal Required Inputs For Project-016

1. `project-014-langgraph-orchestration-runtime-adoption-completion-audit-summary.md`
2. `DA-143`
3. `DA-144`
4. `DA-145`
5. `DA-148`
6. `DA-151`
7. `DA-157`
8. 本产物 `DA-160`
