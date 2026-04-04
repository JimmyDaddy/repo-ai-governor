# Repo AI Governor `session.main` 规划生成与台账提交契约（Draft）

- Status: draft
- Date: 2026-04-04
- Scope: service-owned `plan` capability / plan preview / confirmation-gated ledger commit / sprint ledger projection
- Target Module IDs:
  - `runtime.orchestration`
  - `runtime.durable-storage`
  - `runtime.cli-interactive-shell`
- Implementation Surfaces:
  - `packages/core-orchestration-service`
  - `packages/shared`
  - `apps/cli`
- Related:
  - `.repo-ai-governor/draft/cli-capability-maturity-and-baseline-enhancement-priority-analysis.md`
  - `.repo-ai-governor/draft/session-main-capability-explainer-and-contextual-command-guidance-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/contracts/registry-and-ledger-projection-contract.md`
  - `.repo-ai-governor/context/current-context.md`
  - `apps/cli/src/commands/plan-command.ts`

## 1. 背景与问题

当前 `plan` 命令仍是薄基线实现：它只会在 `context/plan/plan-*.json` 下写一份 snapshot artifact，而不会真正完成以下用户预期：

1. 从自然语言目标中生成可执行的 task breakdown。
2. 让用户在提交前看到结构化 preview，并做增量追问或修订。
3. 把确认后的规划同步到正式 sprint 台账：
   - `plan.md`
   - `tasks/checklist.md`
   - `tasks/tasks.csv`
   - `tasks/TK-xxx.md`

这导致当前产品虽然已经有 `plan` 入口，但还没有“会话里真能规划并落账”的正式能力。

## 2. 目标

本契约的目标是把 `session.main` 中的 `plan` 定义为正式能力，而不是 snapshot-only 占位命令。

具体目标：

1. 支持用户通过自然语言提出规划请求。
2. 让 runtime 基于当前 workspace facts 与 active stream 生成结构化 plan preview。
3. 支持用户在 preview 基础上继续 refinement，而不是每次重来。
4. 对会修改正式台账的动作一律走 `preview + explicit confirm`。
5. 在确认后把计划投影到仓库既有 sprint ledger，而不是新增平行真值。

## 3. 非目标

1. 不把 `plan` 变成第二套后台 workflow planner。
2. 不在第一阶段自动执行规划中的任务。
3. 不自动切换 `current-context.md` 中的 active stream。
4. 不绕过既有 `plan.md / checklist.md / tasks.csv / TK-xxx.md` 的 ledger 约束。
5. 不让 CLI shell 自己推断或重写 planning truth。

## 4. 归属判断

这个契约的 canonical owner 应是 `runtime.orchestration`，而不是 `runtime.cli-interactive-shell`。

原因：

1. `plan` 的核心语义是 `session.main` 如何理解规划意图、如何生成 preview、何时允许提交到正式台账。
2. CLI shell 只负责呈现 preview、确认态和结果回显，不应拥有 planning truth。
3. `runtime.durable-storage` 负责 ledger projection 的持久化边界，但不拥有“该不该生成这份计划”的前台能力语义。

因此，当前先在 `draft` 保存；未来正式化时，建议归档到：

1. `runtime-orchestration/contracts/session-main-planning-and-ledger-projection-contract.md`
2. 必要时由 `runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md` 做 consumer cross-link

## 5. 理想中的用法

理想中的 `plan` 不应只是“生成一份 JSON artifact”，而应是一个可对话、可确认、可落账的正式流程。

推荐用户路径：

1. 用户提出目标：
   - 例如“帮我把这个需求拆成 sprint 计划”
   - 或“先给我一个实现方案，再按任务落到当前 sprint”
2. `session.main` 返回 plan preview：
   - sprint goal
   - task package
   - risks
   - verification points
   - ledger projection preview
3. 用户继续 refinement：
   - “把 review 提前”
   - “拆成 4 个 TK”
   - “把验证单独成任务”
4. runtime 基于同一 preview 更新计划，而不是重新从零生成
5. 用户确认后，runtime 才把内容正式写入 sprint ledger
6. shell 展示写入结果与 backlinks

## 6. 输入契约

建议 `session.main` 内部最小请求结构如下：

```ts
interface SessionMainPlanRequest {
  requestId: string;
  userGoal: string;
  targetStreamId: string;
  targetProjectId: string;
  targetSprintId: string;
  planningMode: 'task_breakdown' | 'sprint_seed' | 'refinement';
  commitIntent: 'preview_only' | 'preview_then_confirm';
  sourceTurnId: string;
  priorPlanId?: string;
  constraints?: {
    maxTasks?: number;
    preferExistingTaskIds?: boolean;
    requestedOwner?: string;
    requestedDueDate?: string;
    requestedPriority?: 'P0' | 'P1' | 'P2' | 'P3';
  };
}
```

约束建议：

1. 默认目标必须来自 `.repo-ai-governor/context/current-context.md` 的 active primary stream。
2. 若用户点名 planned follow-up stream，第一阶段只允许生成 preview，不允许直接 commit。
3. 若用户没有提供 owner / due date / priority，runtime 可以推断，但必须把推断结果展示在 preview 中。
4. 若关键 ledger 字段无法可靠推断，preview 必须标记为 `not commit ready`。

## 7. 输出契约

推荐把 `plan` 的输出拆成两层：

1. 对用户可读的 plan answer
2. 对正式台账可写的 ledger projection preview

建议最小结构：

```ts
interface SessionMainPlanPreview {
  planId: string;
  targetStreamId: string;
  planSummary: string;
  sprintGoal: string;
  taskPackage: Array<{
    provisionalTaskId: string;
    title: string;
    owner: string;
    priority: 'P0' | 'P1' | 'P2' | 'P3';
    dueDate: string;
    statusSeed: 'planned';
    implementationPlan: string[];
    verification: string[];
    dependsOn: string[];
  }>;
  exitCriteria: string[];
  risks: string[];
  assumptions: string[];
  ledgerProjectionPreview: {
    planMd: 'update';
    checklistMd: 'append';
    tasksCsv: 'append';
    tkFiles: 'create';
  };
  commitReadiness: 'ready' | 'needs_user_input' | 'preview_only';
  missingFields: string[];
}
```

这个 preview 应至少回答五件事：

1. 这轮 planning 的目标是什么。
2. 将拆出哪些任务。
3. 每个任务的最小 owner/priority/due date 是什么。
4. 验证点和 exit criteria 是什么。
5. 一旦确认，会落到哪些 ledger 文件。

## 8. 确认与提交契约

`plan` 的 mutation path 默认必须走 `preview + explicit confirm`。

推荐约束：

1. 当用户只是问“怎么规划”时，允许 `answer_only`。
2. 当用户明确要求“写入当前 sprint / 落到台账”时，runtime 仍必须先给 preview。
3. 只有在用户显式确认后，才允许进入 ledger commit。
4. pending plan commit 必须进入 shared session truth，确保 `resume` 后仍可恢复。
5. shell 只能消费 `pending/confirmed/committed/cancelled` 等状态，不得本地生成伪确认流程。

第一阶段不建议支持 `direct_commit`。

## 9. Ledger 投影规则

### 9.1 总原则

正式真值必须继续写回既有 sprint ledger，而不是新增另一套 planning registry。

### 9.2 `plan.md`

提交后应更新目标 sprint 的 `plan.md`，至少同步：

1. `Sprint Goal`
2. `Task Package`
3. `Exit Criteria`
4. `Execution Notes`

约束：

1. 应做增量更新，不得无差别重写历史内容。
2. 若 `plan.md` 已存在既有任务包，新增内容应以 append-or-reconcile 方式并入。

### 9.3 `tasks/checklist.md`

提交后应追加 flat checklist task items，并初始化执行记录。

每条新任务至少要有：

1. `- [ ] TK-xxx title`
2. 一条“任务创建，状态初始化为 `planned`”的执行记录

约束：

1. 不得伪造 `in_progress` 或 `completed` 记录。
2. 不得改写既有已完成任务的执行历史。

### 9.4 `tasks/tasks.csv`

提交后应为每个新任务追加一条 `planned` 状态记录。

当前 ledger schema 下建议填写：

1. `execution_id`
2. `task_id`
3. `title`
4. `owner`
5. `priority`
6. `due_date`
7. `status=planned`
8. `project`
9. `sprint`
10. `plan`
11. `result=待执行`
12. `verify=待验证`
13. `review_delta=待执行`
14. `recorded_at`

约束：

1. task ledger sqlite canonical truth 不能被跳过；`plan` commit 应先写 canonical rows，再渲染 `tasks.csv` 视图。
2. `tasks.csv` 仍应作为人类可读 ledger view 一并产出，但不再是独立主真值。
3. `plan` commit 只能写 seed planning rows，不能伪造执行结果。

### 9.5 `tasks/TK-xxx.md`

提交后应为每个新任务生成 skeleton。

建议骨架至少包含：

1. Status
2. Date
3. Owner / Priority / Project / Sprint
4. 任务目标
5. Depends On
6. 预期产物
7. 实施计划
8. 验证
9. 执行记录

约束：

1. 初始状态必须是 `planned`。
2. `执行记录` 只允许写入创建态记录。
3. `TK-xxx` 编号应基于目标 sprint 现有最大编号做顺序分配。

## 10. 与现有实现的关系

当前 `apps/cli/src/commands/plan-command.ts` 只负责写：

1. `context/plan/plan-*.json`

该 artifact 可以在过渡期保留，但应降级为：

1. debug artifact
2. preview snapshot
3. trace / audit input

它不应继续被当作正式 planning truth。

同时，这份 draft 不是独立凭空冒出来的 contract，而是对
`.repo-ai-governor/draft/cli-capability-maturity-and-baseline-enhancement-priority-analysis.md`
中 `plan` 薄基线判断的专项收口：

1. 上游分析文说明：为什么 `plan` 需要被优先补强，但不应无限扩张为“大而全的规划系统”。
2. 本文说明：既然决定补 `plan`，第一批 contract 到底应补哪些状态、输出和 ledger 投影边界。

## 11. 边界规则

### 11.1 与 capability explainer 的边界

1. “`plan` 是做什么的”属于 capability explanation。
2. “帮我生成一个计划 preview”属于 planning preview。
3. “把这个计划写入当前 sprint 台账”属于 confirmation-gated commit。

三者必须是连续能力，但不能混成同一状态。

### 11.2 与 workflow planner 的边界

1. `session.main plan` 是前台用户规划入口。
2. workflow planner 是后台治理/执行流程节点。
3. 前者可以桥接到后者，但不能替代后者。

换句话说：

1. `session.main` 负责把用户目标收敛成可确认的 task package。
2. workflow/runtime 负责后续执行、验证、审计和闭环。

### 11.3 与 shell 的边界

1. shell 只渲染 plan preview、pending confirm 和 commit result。
2. shell 不拥有 task ID allocation、ledger write rule 或 commit policy。

### 11.4 与 current-context 的边界

1. 默认 commit 目标必须是 active primary stream。
2. planned follow-up stream 在未激活前，只能作为 preview target。
3. 若后续需要支持“边规划边激活新 stream”，应作为单独 contract，而不是塞进第一版 `plan` commit。

## 12. 分阶段实现建议

### Phase A

把当前 `plan` 从 snapshot-only 提升为真正的 plan preview：

1. 能输出 sprint goal、task package、exit criteria、risks
2. 能在 session.main 中继续 refinement
3. 仍不直接写台账

### Phase B

补齐 confirmation-gated ledger commit：

1. 写 `plan.md`
2. 写 `checklist.md`
3. 写 `tasks.csv`
4. 生成 `TK-xxx.md`

### Phase C

补齐 reconcile / revise 能力：

1. 对既有 task package 做增量变更
2. 检测 task title / order / dependency 冲突
3. 给出 safe append 与 reconcile 策略

## 13. 与 CLI 能力成熟度分析 draft 的关系

为避免后续起项目时遗漏上下文，建议把两篇 draft 固定成联读关系：

1. `.repo-ai-governor/draft/cli-capability-maturity-and-baseline-enhancement-priority-analysis.md`
   提供上游决策背景：
   - `plan` 仍是薄基线能力
   - 它在 ROI 维度高于 `review / review-verify`
   - 但在战略主线优先级里又低于 `review / review-verify`
2. 本文提供下游实现边界：
   - `plan request / preview / commit readiness`
   - `preview + explicit confirm`
   - `ledger commit`
   - `plan.md / checklist.md / tasks.csv / TK-xxx.md` 投影规则

后续只要新项目的目标是“补强 `plan` 命令真实能力”，建议默认把两篇一起放入项目输入，不要只引用其中一篇。

立项时最容易漏掉的点，建议直接按下面检查：

1. 是否明确把项目范围限定在 `plan`，而不是顺带吞入 `review / review-verify / run`。
2. 是否明确本期只做 `preview`，还是要做到 `explicit confirm + ledger commit`。
3. 是否明确 shared session / shell / durable storage 的 owner 边界，避免 shell 自己变成 planning truth owner。
4. 是否明确台账提交只能落到既有 sprint ledger，而不是新建平行 planning registry。

## 14. 最终建议

`plan` 的理想形态应是：

1. `session.main` 内的正式 planning capability
2. 先生成 preview
3. 允许追问与 refinement
4. 再显式确认
5. 最终投影到既有 sprint ledger

这样既不会把它做成第二套 workflow engine，也不会继续停留在 “只是写一份 plan snapshot JSON” 的薄基线状态。
