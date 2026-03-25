# DA-145 LangGraph Phase 0 spike、cutover parity 验证与 rollout 迁移计划

- Status: active
- Date: 2026-03-25
- Source Task: `TK-145`
- Project: `project-014-langgraph-orchestration-runtime-adoption`
- Sprint: `sprint-001-runtime-adoption-and-migration-baseline`

## 1. 交付摘要

`project-014` 的迁移策略固定为“单目标 LangGraph runtime + 短生命周期 cutover parity harness”。Phase 0 只验证最小闭环、service contract 与 checkpoint/recovery 语义，不把 `legacy runtime` 做成长期并存产品能力。

## 2. Phase 0 最小闭环

### 2.1 必做闭环

1. `run -> review -> review-verify`
2. 至少 1 条 `HITL interrupt/resume` 路径
3. 至少 1 次 artifact/audit/report 正式回写
4. 至少 1 次 checkpoint-based recovery 演练

### 2.2 推荐聚焦范围

1. 只覆盖 `task-driven run` 主链，不先扩到所有 CLI 命令。
2. 只覆盖当前已有的 `prepare / artifact_context / execute / verify / review / review_verify / report` 语义。
3. delivery rehearsal 在 Phase 0 只要求“不破坏现有 contract”，不是先行迁移阻断项。

## 3. Cutover Parity Harness 口径

### 3.1 目标

证明 `LangGraph` backend 在 facade 层面对外行为与现有 runtime 保持可接受等价，而不是证明两套 backend 永久共存。

### 3.2 比较面

1. `pretty/plain/json` 外部输出字段稳定性
2. artifact 生成与路径回链一致性
3. audit records 的关键字段稳定性
4. review chain / HITL / recovery 的生命周期语义
5. failure semantics：`blocked / interrupted / failed / completed`
6. replay/recovery 的可解释性与后续恢复结果

### 3.3 不要求逐字一致的面

1. graph 内部节点日志顺序
2. 内部 checkpoint payload 结构
3. runtime backend 内部 event fan-out 实现细节

### 3.4 Parity 通过标准

1. facade 对外 contract 不漂移
2. workspace canonical sources 不漂移
3. interrupt/resume、artifact/audit/review 的终态一致
4. 任何差异都能被解释为“内部实现差异”，而不是治理语义变化

## 4. Checkpointer 路径

### 4.1 路线

1. Phase 0：file-backed checkpointer
2. Phase 1：`sqlite-fs` checkpointer
3. 后续：挂接 shared local orchestration service 的 execution recovery

### 4.2 原因

1. file-backed 适合先做最小恢复链路验证
2. `sqlite-fs` 更适合作为 CLI 与桌面端共用的本地持久化基线
3. service 化之前先把恢复语义跑通，能降低进程模型变化带来的调试复杂度

### 4.3 Checkpoint 准入限制

1. 仅保存 execution cursor、interrupt state、graph-local reduced state、artifact/task/session 引用
2. 不保存 `current-context/tasks/review/artifacts/audit` 正文作为唯一事实源

## 5. Rollout 顺序

### 5.1 Sprint-002 推荐拆解顺序

1. `core-runtime-langgraph` backend skeleton
2. facade backend selector 与 cutover harness
3. file-backed checkpointer + recovery smoke
4. `run/review/HITL` 最小闭环接线
5. `sqlite-fs` checkpointer 与 service shell 收敛

### 5.2 Cutover 策略

1. 开发期允许 `legacy runtime` 只作为 comparison backend 存在
2. 一旦 facade parity 与 recovery smoke 通过，即应把默认 backend 切向 `LangGraph`
3. 后续删除 `legacy runtime` 专用 comparison path，不把它保留成长期 product mode

## 6. 风险与阻断条件

### 6.1 主要风险

1. 若把 policy/audit/ledger 直接下沉到 LangGraph node，会破坏 canonical source 边界
2. 若 service contract 与 CLI current contract 不一致，会导致 cutover 测试失真
3. 若 checkpoint 中混入不可重放 side effects，会让 recovery 语义不可靠
4. 若桌面端先行接线而 service shell 未稳，会把 client/runtime 边界重新做散

### 6.2 Block 条件

1. facade 输出 contract 漂移
2. review/HITL/recovery 生命周期与现有治理语义不一致
3. artifact/audit/ledger 无法稳定回写 workspace canonical sources
4. parity harness 只能依赖内部日志，而不能从正式产物判断结果

## 7. 验收矩阵

| 维度 | 验收问题 | 通过标准 |
|---|---|---|
| Phase 0 闭环 | `run -> review -> review-verify -> HITL -> recovery` 是否可跑通 | 至少 1 条完整成功链与 1 条 interrupt/resume 链 |
| facade contract | CLI 输出是否稳定 | `pretty/plain/json` 关键字段不漂移 |
| canonical sources | 正式状态是否仍回写 workspace | audit/artifact/review/ledger 均落到既有事实链 |
| checkpointer | 恢复是否可靠 | 中断后可从 checkpoint 恢复且终态正确 |
| service boundary | CLI/desktop 是否都能依赖同一 contract | DTO/event contract 可复用，不直接耦合 runtime internals |
| rollout readiness | 是否可以进入 sprint-002 实装 | 风险已收敛到实现问题，而不是边界未决问题 |

## 8. 对 sprint-002 的输入约束

1. 默认目标 backend 只有 `LangGraph`
2. `legacy runtime` 只允许作为短期 comparison harness
3. service shell 必须优先服务 `run` 主链，不先做大全命令覆盖
4. 桌面端若提前开始，只能消费 service client contract，不得旁路调用 runtime internals
5. 所有 parity/recovery 结论必须能从 artifact/audit/review/report 这些正式产物验证

## 9. 证据路径

1. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-143-process-runtime-to-langgraph-adapter-boundary-and-state-contract-baseline.md`
2. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/DA-144-shared-local-orchestration-service-cli-desktop-contract-baseline.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
4. `.repo-ai-governor/draft/langgraph-orchestration-technical-solution.md`
