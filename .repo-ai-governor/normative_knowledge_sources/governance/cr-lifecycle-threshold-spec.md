# CR Lifecycle Threshold Spec

- Status: active
- Date: 2026-03-22
- Scope: code review lifecycle governance
- Owner: `project-008-workflow-optimization / TK-041`

## 1. Purpose

1. 统一 `review -> verified -> resolved` 状态切换标准。
2. 让不同执行者对同一 CR 的状态判断保持一致。

## 2. State Definitions

### 2.1 `code_review_<slug>.md` / legacy `review_<slug>.md`

定义：

1. 已输出发现，但尚未完成逐条验证。

最小必备字段：

1. 范围与任务标识。
2. 发现列表（含严重级别）。
3. 初步风险说明。
4. 顶部元数据必须为 `Status: review_pending`。

### 2.2 `verified_code_review_<slug>.md` / legacy `verified_review_<slug>.md`

定义：

1. 发现已逐条复核并给出明确结论。

进入条件（全部满足）：

1. 每条发现均有结论：`accepted/rejected/deferred`。
2. 每条 accepted/deferred 发现均有证据命令或事实依据。
3. 文档追加“验证命令”与“风险与后续”章节。
4. 顶部元数据必须为 `Status: verified`。

### 2.3 `resolved_code_review_<slug>.md` / legacy `resolved_review_<slug>.md`

定义：

1. 已接受发现完成处理并再次核验。

进入条件（全部满足）：

1. accepted 发现已修复，或有明确豁免记录。
2. 修复后验证命令已重跑并记录结果。
3. 文档追加“处置结果与剩余风险”章节。
4. 顶部元数据必须为 `Status: resolved`。

## 3. Transition Rules

1. 复核结果必须追加在同一 CR 文件中，不新开并行 CR 文档。
2. 状态迁移通过文件重命名实现：
   - `code_review_` / `review_` -> `verified_code_review_` / `verified_review_`
   - `verified_code_review_` / `verified_review_` -> `resolved_code_review_` / `resolved_review_`
3. 文件重命名与顶部 `Status` 更新必须在同一变更中同步完成，禁止出现“文件名前缀已迁移但正文状态未更新”的漂移。
4. 若复核未通过，不允许迁移到下一状态。

## 4. Exception Handling

1. `deferred` 项必须写明阻塞原因、责任人和目标处理窗口。
2. 高风险 deferred 项需触发 HITL 决策，不得默认放行。

## 5. Verification Checklist

1. 状态迁移后，`tasks/checklist/tasks.csv/TK` 记录必须同步。
2. 至少执行：
   - `node ./scripts/governance/check-code-review-status-sync.js`
   - `node ./scripts/governance/check-task-ledger-sync.js`
   - `node ./scripts/governance/check-sprint-plan-status-sync.js`
