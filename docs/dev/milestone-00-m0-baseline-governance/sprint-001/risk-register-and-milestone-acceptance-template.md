# 风险台账与里程碑验收模板（TK-005）

- Status: active
- Date: 2026-03-18
- Milestone: `M0`
- Sprint: `sprint-001`
- Task: `TK-005`

## 1. 目标

为后续各里程碑退出评审提供统一的风险管理与验收判定基线，避免“仅完成实现、未完成可审计收口”。

## 2. 适用范围与边界

1. 适用范围：
   - `M0~M5` 里程碑退出类任务与最终发布评审任务。
   - 需要人工确认（HITL）或跨角色签字的验收场景。
2. 不在本模板覆盖范围：
   - 具体业务功能实现细节（由对应 task 文档负责）。
   - 工具内部监控指标计算逻辑（由后续实现任务负责）。

## 3. 风险台账模板

### 3.1 分级规则（统一口径）

1. `likelihood`：1~5（极低到极高）
2. `impact`：1~5（极低到极高）
3. `risk_score = likelihood * impact`
4. 风险等级：
   - `1~6`: low
   - `7~12`: medium
   - `13~25`: high

### 3.2 状态集合（建议）

1. `open`
2. `mitigating`
3. `watching`
4. `closed`
5. `accepted`

### 3.3 台账字段模板

| risk_id | title | category | owner | likelihood | impact | risk_score | status | trigger_condition | mitigation_plan | fallback_plan | related_tasks | evidence_links | identified_at | last_reviewed_at | target_closure_at |
|---|---|---|---|---:|---:|---:|---|---|---|---|---|---|---|---|---|
| RSK-001 | 示例：依赖边界规则未执行到 CI | governance | Architecture | 3 | 4 | 12 | open | 新包接入未配置 boundary gate | 在 `TK-115` 先以 warning 接入 | 若持续失败则回退到人工阻断清单 | TK-115\|TK-503 | `code-review/...` | 2026-03-18 10:00:00 +08:00 | 2026-03-18 10:00:00 +08:00 | 2026-04-28 18:00:00 +08:00 |

时间字段统一使用人类可读且精确到秒格式：`YYYY-MM-DD HH:mm:ss Z`。

## 4. 里程碑验收模板

### 4.1 基本信息

| field | value |
|---|---|
| milestone_id | `M0` |
| sprint | `sprint-001` |
| reviewer_group | Architecture / QA / PM |
| execution_session_id | `<shared-session-id>` |
| acceptance_time | `YYYY-MM-DD HH:mm:ss Z` |
| decision | `go / conditional-go / no-go` |

### 4.2 入口条件（Entry Criteria）

1. 对应 sprint 的 `tasks/checklist.md` 与 `tasks/tasks.csv` 已同步。
2. 本里程碑“核心依赖产物”已登记到 `docs/dev/dependency-artifact-registry.md`。
3. CR 生命周期状态可追踪（至少到 `verified_review`）。

### 4.3 必选验证命令（Checkpoint Commands）

```bash
node ./scripts/governance/check-esm-import-specifiers.js
node ./scripts/governance/check-dynamic-import-usage.js
node ./scripts/governance/check-finite-literal-sets.js
node ./scripts/governance/check-utils-reuse-governance.js
node ./scripts/governance/check-type-governance.js
node ./scripts/governance/check-ts-only-residue.js
npm run test -- --maxWorkers=1 --maxConcurrency=1
node ./dist/bin/repo-ai-governor.js --help >/dev/null
```

### 4.4 证据包（Evidence Pack）

1. `plan.md`、`checklist.md`、`tasks.csv` 对齐截图或路径引用。
2. 本里程碑核心任务 CR 文件列表（含状态）。
3. 风险台账快照（含未关闭高风险项处理结论）。
4. 若存在人工介入，附决策记录与通知回执。

### 4.5 验收结论模板

| decision | rationale | open_risks | required_followups | approver | approved_at |
|---|---|---|---|---|---|
| conditional-go | 关键路径通过，存在中风险需下一 sprint 关闭 | RSK-004 | TK-216 | PM | 2026-05-26 19:30:00 +08:00 |

## 5. 推荐落地路径

1. 先在各里程碑 sprint 内创建实际台账：`risk-register.md`。
2. 退出任务（`TK-006/116/216/316/416/516`）统一引用本模板执行验收。
3. 发生风险状态变化时，同步更新 `tasks/checklist.md` 与 `tasks/tasks.csv` 执行记录。

## 6. 验收标准

1. 风险字段、分级规则、状态集合在各里程碑使用口径一致。
2. 验收结论可追踪到命令检查、CR 状态与风险处置证据。
3. 后续退出任务已建立依赖关系并可直接回链本文件。
