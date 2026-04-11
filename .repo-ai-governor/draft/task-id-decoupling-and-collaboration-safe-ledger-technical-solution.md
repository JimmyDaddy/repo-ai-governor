# Task ID 去序号化与多人协作安全台账技术方案（Draft）

- Status: draft
- Date: 2026-04-11
- Owner: AI-Agent
- Scope: `task ledger / task identity / collaboration-safe task creation / non-sequential task ids`
- Target Module IDs:
  - `runtime.durable-storage`
  - `runtime.orchestration`
  - `governance.execution-gates`
- Related:
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/decomposition-protocol-template.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/contracts/registry-and-ledger-projection-contract.md`
  - `scripts/governance/sync-task-ledger.js`
  - `scripts/governance/check-task-ledger-sync.js`
  - `scripts/governance/check-artifact-registry-lifecycle.js`
  - `scripts/governance/reserve-task-id.js`

## 1. 背景与问题

当前仓库把 `TK-xxx` / `CR-xxx` 视为 canonical task identity，并把这种数字递增模式扩散到了：

1. `tasks/TK-xxx*.md` 与 `tasks/CR-xxx*.md`
2. `tasks/checklist.md`
3. `tasks/tasks.csv`
4. sqlite canonical ledger
5. artifact registry 的 `producer_task_id`
6. review lifecycle、delivery handoff、plan task package 与各类 governance gates

这套模型在单人或单线程窗口下可工作，但在多人协作或多 agent 并行拆解时有三个明显问题：

1. `task_id` 同时承担了“身份”和“顺序”两种语义。
2. 新任务创建依赖“下一个数字是多少”，天然引入串行分配点。
3. 一旦多人同时拆任务，就需要额外的号段预留、人工协调或事后重排。

当前新增的 `reserve-task-id.js` 只是止血措施。它能降低冲突，但没有消除“必须先拿号，再建卡”的中心化约束。

因此，需要一个正式结论：任务 identity 应从数字顺序中解耦，让多人可以并行创建任务，而不再受“抢下一个编号”限制。

## 2. 目标

本方案目标如下：

1. 让 `task_id` 变成稳定的 canonical identity，而不是顺序号。
2. 允许多个作者在同一 sprint 或同一 workspace 并行创建任务，而不需要中央数字分配。
3. 保持 `TK` 与 `CR` 两个语义前缀不变，避免破坏现有状态机与角色语义。
4. 保持 sqlite canonical ledger、artifact registry 与 tasks.csv 的 `task_id TEXT` 基础不变，尽量利用已有数据层能力。
5. 允许历史数字编号继续工作，不要求一次性重命名所有旧任务。

## 3. 非目标

本方案当前不做以下事情：

1. 不批量重命名历史 `TK-123` / `CR-001` 任务。
2. 不改变 `TK` 与 `CR` 的状态空间。
3. 不把 `task_id` 从 `tasks.csv`、sqlite、artifact registry 中移除。
4. 不在本轮同时重写 `DA-*`、completion audit、project closeout 等所有衍生命名习惯。
5. 不要求所有现有文档在一个 change window 内全部改成新风格。

## 4. 核心判断

本方案建议采用以下核心判断：

1. `task_id` 应保持为 `TEXT` 型 canonical identity，不再依赖顺序数字。
2. 任务顺序应从 identity 中剥离，改由 `plan` 中的列出顺序、checklist 渲染顺序或未来可选的 `display_order` 承担。
3. 新任务默认使用“语义 slug + 可选冲突消解后缀”的非顺序 ID。
4. 数字型 `TK-123` / `CR-001` 继续作为兼容子集存在，直到仓库完成 parser/gate 全量兼容。

## 5. 推荐的 Task ID 语法

推荐把 canonical grammar 收敛为：

```text
^(TK|CR)-[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:--[a-z0-9]{4,8})?$
```

语义说明：

1. `TK` / `CR`
   - 保留现有任务类型语义。
2. 第一段 slug
   - 来自任务标题的稳定语义归一化。
   - 例如 `archive-split-bootstrap-truth-preservation`
3. 可选 `--suffix`
   - 只在同 slug 冲突时追加。
   - 该后缀不表达顺序，只表达唯一性。

示例：

1. `TK-archive-split-bootstrap-truth-preservation`
2. `TK-archive-split-bootstrap-truth-preservation--a7kd`
3. `CR-task-id-decoupling-initial-review`
4. `CR-task-id-decoupling-recheck--k2mp`

这意味着：

1. 新 ID 仍可读。
2. 不需要“当前最大编号”。
3. 同标题并发创建时也可安全落地。

## 6. 身份与顺序解耦模型

建议明确区分两类概念：

### 6.1 Canonical Identity

`task_id`

1. 全局或至少 workspace 级唯一。
2. 一经创建不再修改。
3. 被以下 surface 共同引用：
   - task card
   - checklist
   - tasks.csv
   - sqlite ledger
   - artifact registry
   - review docs
   - delivery registry / handoff docs 中的 task references

### 6.2 Human Display Order

顺序不再由 `task_id` 表达，而改由以下任一 surface 承担：

1. sprint `plan.md` 的 task package 列出顺序
2. checklist 渲染顺序
3. 未来可选字段 `display_order`

因此：

1. `TK-archive-split-bootstrap-truth-preservation` 不需要看起来“像第 741 个任务”。
2. “它排第几个做”由 plan/checklist 决定，不由 ID 决定。

## 7. 多人协作下的创建模型

这是本方案解决的核心。

推荐的新建流程如下：

1. 用户或 agent 基于标题生成基础 slug。
2. 在目标作用域检查该 `task_id` 是否已存在。
3. 若不存在，直接采用该 slug id。
4. 若已存在，追加短后缀后重试。
5. 创建 task card 后，再由既有同步器回写 sqlite/checklist/tasks.csv。

关键点：

1. 不再需要“拿号段”。
2. 不再要求多人在创建前串行协商 `TK-741` 归谁。
3. 冲突解决从“递增全局数字”变成“本地 slug 检查 + 唯一性后缀”。

## 8. 作用域建议

为避免现有 `task_id` 聚合逻辑在多 source 间把相同 ID 误视为同一任务，推荐把 **所有新 `TK/CR` 都提升为 workspace 级唯一**。

这意味着：

1. `TK` 不再是“workspace 全局编号 + 数字”，而是“workspace 全局唯一 slug id”。
2. `CR` 也不再允许每个 sprint 都有一个 `CR-001`。
3. review round 的区分应通过语义 slug 或后缀表达，而不是局部顺序号。

推荐做法：

1. `CR-task-id-decoupling-initial-review`
2. `CR-task-id-decoupling-recheck`
3. `CR-task-id-decoupling-final-clean`

若同类 round 同时并发出现，再追加 `--suffix`。

## 9. 与当前实现的兼容判断

### 9.1 已经兼容的部分

以下层面天然支持文本型 id：

1. task-ledger sqlite 的 `task_id TEXT`
2. artifact registry 的 `producer_task_id TEXT`
3. delivery registry 中的 `task_ids[]`

因此，底层 durable store 不是阻碍。

### 9.2 当前不兼容的部分

真正的阻碍在 parser 与 gate：

1. `sync-task-ledger.js`
   - 只识别 `^(?:TK|CR)-\\d{3}`
2. `check-task-ledger-sync.js`
   - 只识别数字型文件名、标题和 checklist 行
3. `check-artifact-registry-lifecycle.js`
   - 只识别 `TK-\\d+`
4. 当前 draft/template 文档
   - 把 `TK-xxx` / `CR-xxx` 写成规范本身
5. 现有 `reserve-task-id.js`
   - 仍然是数字号段分配器

所以本问题不是“数据层不支持”，而是“治理脚本和规范层目前还把数字写死了”。

## 10. 迁移策略

推荐采用三阶段迁移。

### Phase A: Grammar Widening

先让仓库“读得懂新 ID”，但不强制新建任务立即切换。

范围：

1. 放宽所有 task-card/checklist/file-name regex。
2. 保持数字型 ID 继续合法。
3. 更新 tests / fixtures / examples，使其覆盖数字与非数字两类 task id。

完成标准：

1. 所有 gates 可同时接受 `TK-741` 与 `TK-archive-split-bootstrap-truth-preservation`。
2. 不需要批量重写历史数据。

### Phase B: Creator Cutover

再把“创建新任务”的默认行为切换到非顺序 ID。

范围：

1. 新增或改造 task creator / plan commit / decomposition writer。
2. 停止默认走数字分配。
3. `reserve-task-id.js` 降级为 legacy compatibility tool，或直接被新的 `allocate-task-id` / `create-task-card` 替代。

完成标准：

1. 同一 sprint 下两位作者可并行建卡，不需要协商数字号段。
2. 新任务默认使用 slug id。

### Phase C: Optional Alias And Cleanup

这是可选阶段，不属于本次最小闭环。

范围：

1. 为少数需要重命名的历史任务引入 `task_aliases` 或 redirect note。
2. 清理文档中“必须是 `TK-xxx` / `CR-xxx`”的过时 wording。

## 11. 对现有治理面的影响

### 11.1 Task Card

仍保留：

1. `# <TASK-ID> <title>`
2. `Status / Date / Owner / Priority / Project / Sprint`

变化：

1. `<TASK-ID>` 从 `TK-741` 扩展为任意符合 grammar 的文本 id。

### 11.2 checklist

仍保留：

1. `- [ ] <TASK-ID> <title>`

变化：

1. 不再假定 `<TASK-ID>` 是三位数字。

### 11.3 tasks.csv / sqlite

无 schema 级变化。

变化只在于：

1. `task_id` 字段不再被解释为数字序号。

### 11.4 sprint plan

变化：

1. task package 列出顺序继续保留。
2. 顺序不再依赖 `task_id` 的数字大小。

## 12. 为什么这能解除多人协作瓶颈

本方案对多人协作的直接收益有三点：

1. 创建新任务不再需要“中央拿号”。
2. merge conflict 从“同一数字编号冲突”收敛为更少见的“相同 slug 冲突”。
3. 即使发生同标题冲突，也能通过非顺序后缀本地解决，而不必重排整个编号序列。

换句话说，任务 identity 从“共享计数器”变成了“语义名 + 唯一性校验”，自然更适合多人和多 agent 并行。

## 13. 风险与权衡

### 13.1 可读性风险

长 slug 可能比 `TK-741` 更长。

缓解：

1. creator 对 slug 长度做上限控制。
2. checklist / plan 展示时允许缩略 id。

### 13.2 同标题冲突

两个作者可能基于同一标题生成相同 slug。

缓解：

1. 冲突时自动追加短后缀。
2. 把“后缀”视为唯一性补丁，而不是顺序号。

### 13.3 旧脚本和旧文档惯性

大量 gate、fixture、review wording 目前仍写死 `TK-xxx/CR-xxx`。

缓解：

1. 先做 Phase A parser widening。
2. 再做 creator cutover。
3. 明确禁止“文档先改、脚本未兼容”的半迁移状态。

## 14. 推荐的最小批准范围

若基于本 draft 后续立项，建议先批准最小闭环：

1. 统一 task id grammar
2. 放宽 parser / gate / test fixture
3. 新建 task creator 改为 slug-first
4. 保持历史数字 id 完全兼容

以下内容可延后：

1. 历史任务重命名
2. alias registry
3. `DA-*` / completion audit / report title 的全面美化

## 15. 结论

本 draft 的核心结论是：

1. 数字递增编号不是 task ledger 的本质需求，而只是当前仓库的一层历史命名约定。
2. 为了避免数字编号继续限制多人协作，应把 `task_id` 正式收敛为“非顺序、可读、可校验唯一”的文本 identity。
3. 真正需要改造的是规范与 parser，而不是 sqlite schema。
4. 最合理的路径不是“先发明更聪明的拿号器”，而是“停止把顺序号当成 identity”。
