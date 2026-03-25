# DA-166 sprint-001 出口验收与后续 rollout 输入约束

- Status: active
- Date: 2026-03-26
- Producer Task: `TK-166`

## 1. 出口结论

当前判定：`accept`。

`project-016 / sprint-001-vendor-adapter-and-sidecar-baseline` 已满足本轮 sprint exit criteria：

1. 社区 LangGraph vendor adoption 与 package truthfulness 路线已经明确。
2. graph-first execution semantics 与 migration scaffolding 的收敛策略已形成正式基线。
3. `sidecar + ipc` host、desktop execution path 与 service ops/release baseline 已形成正式实现与门禁证据。

## 2. 本轮已成立的正式证据

1. `DA-161`
   - project-016 bootstrap 与 runtime productization 范围重排已冻结。
2. `DA-162`
   - `core-runtime-langgraph` 的 vendor truthfulness 已收敛为 `optional peer + binding seam`，不再谎报“已完成 vendor adoption”。
3. `DA-163`
   - `ProcessRuntimeFacade` 已在 `langgraph` primary path 下真实调用 graph-first backend。
4. `DA-164`
   - `sidecar + ipc` 已形成正式本地 orchestration service host baseline。
5. `DA-165`
   - desktop execution surface 与 service ops/release baseline 已收口到正式 integration asset、smoke 与 local distribution gate。

## 3. sprint-001 验收结果

1. task 层状态
   - `TK-161` ~ `TK-166` 共 `6/6 completed`
2. 能力层状态
   - LangGraph runtime truthfulness 已与实际实现对齐
   - graph-first execution 已不再停留在 prepare-only shell
   - `sidecar + ipc` 已从 descriptor smoke 升级为正式 host
   - desktop execution surface 已具备正式入口与 release/local verification 约束
3. release / quality 层状态
   - `check:desktop-entry-smoke`
   - `release:verify-local`
   - `check-release-ready`
   - `pnpm run check`
   均已给出通过证据

## 4. project-016 完成态判断

1. 当前 `project-016` 可以切换为 `completed`。
2. 理由：
   - project DoD 三项已全部满足
   - 当前 project 只定义了一个 sprint，且该 sprint 已完成
   - 后续若再扩围到新的 vendor/runtime feature，不属于本轮 baseline 的阻断项，应以新的 follow-up stream 承接

## 5. 后续 rollout 输入约束

1. desktop 继续只承诺 `sidecar + ipc`，不承诺 `daemon + http`。
2. desktop / CLI / future host 只能继续消费 `@repo-ai-governor/orchestration-service-client` 的 DTO / event contract，不得旁路 runtime internals。
3. `@langchain/langgraph` 当前支持线以稳定 `1.x` 为准；若后续引入更深 vendor-specific execution 绑定，必须先更新 truthfulness 与 package/release contract。
4. sidecar/runtime 关键产物必须继续纳入 local distribution 与 release readiness gate，避免 desktop/service 基线在发布面回退。
5. 若切换新的 primary active stream，应在同一变更窗口把 `project-016 / sprint-001` 从 `current-context.md` 迁入 `completed-streams-history.md`。
