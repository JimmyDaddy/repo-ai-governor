# Repo AI Governor Scoped Delegated CR Loop 产品化技术方案（Draft）

- Status: draft
- Date: 2026-04-06
- Scope: scoped task/sprint/project execution, delegated review loop, `CR-xxx` task-card lifecycle, adapter-neutral reviewer orchestration
- Target Modules:
  - `runtime.orchestration`
  - `runtime.durable-storage`
  - `runtime.agent-projection`
  - `runtime.cli-interactive-shell`
- Related Inputs:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/draft/session-main-review-generation-verification-and-ledger-backfill-contract.md`
  - `.repo-ai-governor/draft/cli-borrowed-capabilities-productization-technical-solution.md`
  - `packages/standards/src/examples/workflow-review-governance-pack.ts`
  - `apps/cli/src/runtime/review/cli-review-task-card-runtime.ts`
  - `apps/cli/src/commands/review-command.ts`
  - `apps/cli/src/commands/review-verify-command.ts`
  - `apps/cli/src/cli-governance-runtime.ts`
  - `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
  - `.codex/skills/workspace-scoped-cr-loop/SKILL.md`
  - `.codex/skills/workspace-scoped-cr-loop/scripts/resume-or-bootstrap-cr-round.mjs`
  - `.codex/skills/workspace-scoped-cr-loop/scripts/bootstrap-cr-round.mjs`

## 1. 目的

把当前仓库里已经验证可行的 `workspace-scoped-cr-loop` skill，下沉为 Repo AI Governor 面向 adopter 仓库的正式产品能力。

本方案要回答的不是“skill 能不能继续用”，而是：

1. 哪些能力已经足够稳定，应该进入工具正式 runtime。
2. 这些能力该挂在哪些现有模块，而不是继续停留在 repo-local script + prompt template。
3. 用户未来是否能够通过本工具在自己的仓库里，用一次受治理的命令完成“执行边界 -> delegated review -> verify -> 修复 -> fresh recheck -> clean closeout”的闭环，并自动生成与推进 `CR-xxx` 任务卡。

## 2. 背景与问题

当前仓库已经出现了两层现实：

1. 产品层已经明确要求：
   - Repo AI Governor 是“流程化多 Agent 开发治理编排”工具。
   - `tasks/TK-xxx.md` 与 `tasks/CR-xxx.md` 是正式用户可见治理产物。
   - `review -> review-verify -> ledger backfill` 应进入受控运行时子链，而不是只靠外部人工拼接。
2. 实现层已经具备一批可复用基线：
   - `review` / `review-verify` 已能管理 `CR-xxx` 任务卡和 review artifact 生命周期。
   - task-driven `run` 已有 inline review subchain 与 controlled delivery rehearsal。
   - `session.main` supervisor 已有 reviewer 角色路由与 delegation guard。
   - standards 示例包已经声明“每轮 governed review 都必须分配独立 `CR-xxx`”。
3. 但用户若想做“执行一个 task/sprint/project，并强制每个边界都跑 delegated CR loop”，仍主要依赖 repo-local skill：
   - 通过脚本解析 scope。
   - 通过脚本分配或恢复 `CR-xxx`。
   - 通过 markdown prompt template 拼 reviewer prompt。
   - 通过主 agent 手工记忆 round/resume/commit 约束。

这层 skill 原型对于本仓库自举很有效，但它仍有 4 个不足：

1. 它是 Codex-style repo-local workflow，不是 adopter-facing product contract。
2. 它把部分运行时状态藏在脚本逻辑与 prompt 约定中，而不是 service-owned orchestration state。
3. 它仍偏向单宿主假设，不适合作为 Claude Code / Codex / GitHub Copilot 的统一正式语义。
4. 它把“boundary commit 建议”和“CR round resume 约束”做成了 skill ergonomics，而不是产品内的受控 side effect / replay contract。

## 3. 目标

### 3.1 必须达成

1. 用户可以在 adopter 仓库中，通过 Repo AI Governor 的正式命令或正式运行模式，执行 `task`、`sprint` 或 `project` scope 的 delegated CR loop。
2. 每一轮 fresh review 都自动分配独立 `CR-xxx`，并保持：
   - `CR-xxx` task card
   - `code_review_* / verified_code_review_* / resolved_code_review_*`
   - `tasks/checklist.md`
   - `tasks/tasks.csv`
   在同一受治理链路里同步推进。
3. delegated reviewer 的调用、失败、恢复、重试、resume 必须成为 orchestration service 可审计状态，而不是 skill 私有记忆。
4. 主 agent 对 finding 的 `accepted / rejected / deferred` 处置、修复、verify、fresh recheck 必须成为正式 loop contract。
5. 能力必须 adapter-neutral，不允许把 Codex prompt 模板或本地脚本参数直接当作产品级事实源。
6. clean round 之后的 boundary commit / delivery checkpoint 应并入已有 controlled delivery rehearsal 路径，而不是继续由 skill 私有脚本独占。

### 3.2 明确非目标

1. 不要求在第一阶段删除 `workspace-scoped-cr-loop` skill。
2. 不要求把每次 `run` 都默认提升为 delegated review；该模式必须显式开启。
3. 不让 reviewer 子 agent 默认拥有代码修改职责；默认仍是 review-only。
4. 不把 runtime checkpointer 或临时 reservation 文件提升为新的 canonical truth。
5. 不新增一个绕过现有 `review` / `review-verify` / `run` 的平行“大命令族”。

## 4. 当前可直接复用的基线

本方案不从零开始，而是复用 3 类既有能力。

### 4.1 已产品化的 review lifecycle 基线

1. `apps/cli/src/runtime/review/cli-review-task-card-runtime.ts`
   - 已拥有 `CR-xxx` 分配、更新、标题生成和 task-card 渲染能力。
2. `apps/cli/src/commands/review-command.ts`
   - 已能为当前 review round 生成 review artifact、transport artifact 和 `CR-xxx` task card。
3. `apps/cli/src/commands/review-verify-command.ts`
   - 已能消费同一 round 的 artifact，推进 `verified/resolved` 并做 managed ledger backfill。

### 4.2 已产品化的 task-driven run 基线

1. `apps/cli/src/cli-governance-runtime.ts`
   - 已在 task-driven `run` 中内联 `review -> review-verify` 子链。
   - 已拥有受 policy 控制的 delivery rehearsal 节点。
2. `apps/cli/src/constants/cli-task-driven-run.constant.ts`
   - 已定义 review/review-verify/delivery-rehearsal 这些受控 stage。

### 4.3 已被 skill 原型验证的高阶能力

1. scope 解析：
   - 识别 `TK-xxx`
   - 识别 `sprint-xxx`
   - 识别 `project-xxx`
   - 兼容 `TK-xxx-<slug>.md` 与 `CR-xxx-<slug>.md`
2. CR round bootstrap / resume：
   - fresh round 分配新 `CR-xxx`
   - 已存在 open round 时 resume
   - round metadata 保留 `Scope Kind / Scope Label / Round Type`
3. review surface：
   - 支持精确边界提示，减少 reviewer boundary bleed
4. boundary commit ergonomics：
   - 已验证“clean round 后给出 commit plan/auto-commit gate”这条用户路径是高价值的

因此，本方案的正确方向不是“照搬 skill”，而是“把 skill 已验证的高阶工作流拆成正式 runtime capability”。

## 5. 总决策

### 5.1 产品化归属

将 scoped delegated CR loop 定义为一项 `runtime.orchestration` 主持、`runtime.durable-storage` 回写、`runtime.agent-projection` 适配 reviewer handoff、`runtime.cli-interactive-shell` 暴露交互入口的跨模块能力。

归属判断如下：

1. `runtime.orchestration`
   - 拥有 scoped loop 的状态机、循环条件、resume/retry 语义。
2. `runtime.durable-storage`
   - 拥有 review artifact、`CR-xxx` task card、ledger projection、round execution receipt 的持久化边界。
3. `runtime.agent-projection`
   - 拥有 delegated reviewer request 到具体 adapter surface 的结构化投影。
4. `runtime.cli-interactive-shell`
   - 拥有用户命令入口、pretty/session-shell 展示与人工处置提示。

`packages/standards` 只负责输出 adopter-facing 规则，不拥有 loop 运行时本身。

### 5.2 命令面决策

优先扩展现有 `run`，而不是新增平行命令。

推荐的一阶段正式入口：

```bash
repo-ai-governor run --task-id TK-615 --review-loop delegated
repo-ai-governor run --scope sprint-001-real-target-repo-adopter-pilot --review-loop delegated
repo-ai-governor run --scope project-055-ga-evidence-and-adopter-pilot-closeout --review-loop delegated
```

补充选项建议：

```bash
repo-ai-governor run \
  --scope TK-615 \
  --review-loop delegated \
  --review-surface apps/cli/src/commands \
  --verification "pnpm run build" \
  --delivery-action commit
```

保留 `review` / `review-verify` 作为：

1. 手动 escape hatch
2. loop 内部 worker stage
3. 低级别调试与 resume 工具

### 5.3 真值分层决策

必须明确区分“canonical governance truth”和“runtime execution cache”。

1. Canonical truth 仍然是：
   - `tasks/CR-xxx.md`
   - `review/code_review_* / verified_code_review_* / resolved_code_review_*`
   - `tasks/checklist.md`
   - `tasks/tasks.csv`
2. Runtime execution cache 只用于：
   - round reservation / resume pointer
   - delegated reviewer dispatch receipt
   - loop-level restart / replay
   - diagnostics

换句话说：

1. `CR-xxx` 和 review artifact 决定“这一轮治理事实是什么”。
2. round cache 只解决“运行时如何恢复到这一轮继续跑”。

### 5.4 Skill 迁移决策

`workspace-scoped-cr-loop` 在短期内保留，但应收缩为薄封装：

1. 它负责把用户自然语言意图映射到正式命令/contract。
2. 它不再拥有 `CR-xxx` 分配规则。
3. 它不再拥有 reviewer prompt 真值。
4. 它不再拥有 boundary commit 真值。

最终方向应是“skill 调产品能力”，而不是“产品模仿 skill”。

## 6. 详细设计

### 6.1 Scope 解析服务

新增一层 service-owned `ScopedExecutionResolver`，统一替代 skill 里的脚本式 scope 推断。

按 `CS-009` 与 `CS-032`，这里涉及的有限集合值在正式实现时不应继续以内联 string-literal union 分散定义，而应集中沉淀为 enum / 常量集。

建议治理方式：

1. 新增 scoped delegated CR loop 自有闭集时，统一放在 `packages/shared/src/constants/**` 或对应 runtime package 的 `src/constants/**`。
2. 已有正式闭集应优先复用既有 enum，例如 delivery action 应优先复用现有 `CliDeliveryRehearsalAction`，不要重新发明一套 `'commit' | 'pr_draft'`。
3. role id 若在第一阶段只允许 reviewer，也应由集中常量或 enum 表达，不直接把 `'reviewer'` 写进 request contract。

建议最小骨架如下：

```ts
enum ScopedExecutionScopeKind {
  TASK = 'task',
  SPRINT = 'sprint',
  PROJECT = 'project',
}

enum ScopedReviewLoopMode {
  NONE = 'none',
  MANAGED = 'managed',
  DELEGATED = 'delegated',
}

enum ScopedCrRoundType {
  INITIAL = 'initial',
  POST_FIX_RECHECK = 'post_fix_recheck',
  PROJECT_FINAL = 'project_final',
}

enum ScopedDelegatedRoleId {
  REVIEWER = 'reviewer',
}
```

建议输入：

```ts
interface ScopedExecutionRequest {
  scopeKind?: ScopedExecutionScopeKind;
  scopeRef: string;
  reviewLoopMode: ScopedReviewLoopMode;
  reviewSurface?: string[];
  verificationCommands?: string[];
  deliveryAction?: CliDeliveryRehearsalAction | null;
}
```

解析规则：

1. `task`
   - 支持 `TK-xxx`
   - 支持 task-card path
   - 支持 `TK-xxx-<slug>.md`
2. `sprint`
   - 支持 sprint id
   - 支持 sprint path
   - scope 缺省时可回退到 `current-context.md` active sprint
3. `project`
   - 支持 project id
   - 支持 project path
   - 若 `run` 需要 project 级 loop，则必须自动推导其剩余 sprint 队列

输出至少应包含：

```ts
interface ScopedExecutionContext {
  scopeKind: ScopedExecutionScopeKind;
  scopeLabel: string;
  scopePath: string;
  projectId: string;
  sprintId: string | null;
  tasksDirPath: string;
  reviewDirPath: string;
  sourceTaskId?: string;
}
```

### 6.2 CR round bootstrap / resume contract

新增 service-owned `ScopedCrRoundService`，吸收 skill 脚本里真正有价值的 round allocator 逻辑。

建议结构：

```ts
interface ScopedCrRoundRequest {
  executionId: string;
  scopeKind: ScopedExecutionScopeKind;
  scopeLabel: string;
  scopePath: string;
  tasksDirPath: string;
  reviewDirPath: string;
  roundType: ScopedCrRoundType;
  reviewSurface: string[];
  resumeIfOpen: boolean;
}

interface ScopedCrRoundBootstrapResult {
  roundId: string;
  crTaskId: string;
  reportSlug: string;
  reviewArtifactPath: string;
  verifiedArtifactPath: string;
  resolvedArtifactPath: string;
  reviewTaskCardPath: string;
  resumedExistingRound: boolean;
}
```

关键规则：

1. fresh review round 必须分配新的 `CR-xxx`。
2. 已 `resolved` 的 `CR-xxx` 永不重开。
3. open round 只有在同一 `scopeKind + scopeLabel + roundType` 且 artifact 未收口时才允许 resume。
4. `Scope Kind / Scope Label / Round Type` 必须进入 `CR-xxx` task card 元数据，而不是只存在运行时内存。

### 6.3 Delegated reviewer handoff contract

当前 skill 用 markdown prompt template 传递 reviewer 上下文。产品化后应改成结构化 handoff request，由 adapter 层渲染为宿主可执行输入。

建议 contract：

```ts
interface DelegatedReviewRequest {
  roundId: string;
  roleId: ScopedDelegatedRoleId;
  scopeKind: ScopedExecutionScopeKind;
  scopeLabel: string;
  scopePath: string;
  reviewDirPath: string;
  crTaskId: string;
  reportSlug: string;
  roundType: ScopedCrRoundType;
  reviewSurface: string[];
  verificationBaseline: string[];
  requiredNormativeInputs: string[];
}
```

适配原则：

1. orchestration service 只产出结构化 request。
2. `runtime.agent-projection` 决定把它投影到 Codex、Claude Code、GitHub Copilot 或未来 surface。
3. adapter renderer 可以生成宿主 prompt，但 prompt 只是 transport view，不是正式 contract truth。
4. delegated reviewer 默认仍是 review-only，不得默认编辑代码。

### 6.4 主循环状态机

推荐把 scoped delegated CR loop 收口为一个正式子图，而不是 skill 的“主 agent 记忆式循环”。

建议主链：

1. `prepare_scope`
2. `execute_scope_boundary`
3. `run_local_verification`
4. `bootstrap_review_round`
5. `delegate_reviewer`
6. `persist_review_round_artifacts`
7. `triage_findings`
8. 条件分叉：
   - 无 actionable findings -> `mark_round_clean`
   - 有 accepted findings -> `apply_fixes`
9. `rerun_verification`
10. `review_verify_same_round`
11. `resolve_round`
12. 条件分叉：
   - 若本轮修复后仍需 fresh reviewer recheck -> 回到 `bootstrap_review_round`
   - 若当前边界已 clean -> `optional_delivery_rehearsal`
13. `report_and_close_boundary`

这里有两个必须固定的语义：

1. `review-verify` 推进的是“同一轮 CR artifact 的状态”。
2. fresh recheck 如果是新 reviewer pass，就必须开启“新一轮 CR”，分配新的 `CR-xxx`。

### 6.5 review / review-verify 的复用策略

一阶段不需要重写所有 review worker，而是优先复用现有命令执行器。

具体做法：

1. `bootstrap_review_round` 之后，由 orchestration runtime 调当前 `CliReviewCommand`。
2. `triage_findings -> apply_fixes -> rerun_verification` 完成后，再调用 `CliReviewVerifyCommand` 推进同一 round。
3. 当 loop 决定需要 fresh reviewer recheck 时，再由 `ScopedCrRoundService` 分配下一轮 `CR-xxx`。

这样可以用最小代价完成“skill 能力 -> 产品能力”的迁移，同时保留已有 `review` / `review-verify` 产物格式不变。

### 6.6 round execution receipt 与 diagnostics

为了让 resume/replay 可靠，需要一层 service-owned round receipt，但它不能替代 canonical review truth。

建议路径：

```text
<workspace>/context/diagnostics/review-rounds/<execution-id>/<round-id>.json
```

建议字段：

1. `round_id`
2. `execution_id`
3. `scope_kind`
4. `scope_label`
5. `cr_task_id`
6. `report_slug`
7. `round_type`
8. `review_surface[]`
9. `dispatch_status`
10. `adapter_surface`
11. `artifact_status`
12. `resumed_from_round_id`
13. `last_error`

它的责任只有两个：

1. 帮 orchestration service 找回“我该从哪一轮继续”。
2. 帮客户端解释“为什么这轮停住了”。

### 6.7 Delivery rehearsal 集成

skill 当前的 boundary commit 建议与 auto-commit 流程有价值，但正式落点不应是 skill 脚本。

正式集成方式：

1. clean round 之后，loop 可进入已有 `delivery rehearsal` stage。
2. delivery action 只允许走受 policy 控制的：
   - `commit`
   - `pr_draft`
3. skill 中的 `--suggest-commit` 可迁移为“仅生成 delivery rehearsal preview”。
4. skill 中的 `--auto-commit` 可迁移为“调用正式 controlled delivery rehearsal action”。

这样可以保持：

1. commit 仍纳入 audit/replay
2. 高风险变更仍停在 HITL
3. 不再把 git side effect 绑死在 repo-local skill 里

### 6.8 Standards pack 扩展

当前 `workflowReviewGovernancePack` 已覆盖最关键的两条规则：

1. 每轮 governed review 分配独立 `CR-xxx`
2. 状态推进时同步 `CR-xxx`、review 文档、checklist、`tasks.csv`

在本方案落地时，建议补充 2 条官方规则：

1. delegated review round 必须显式记录 `scope_kind / scope_label / round_type`
2. fresh reviewer recheck 必须创建新的 `CR-xxx`，不得复用已 `resolved` 的旧 round

这两条规则只定义治理要求，不直接拥有 runtime 状态机。

## 7. 分阶段落地

### Phase A: Bootstrap / Resume Productization

目标：

1. 下沉 scope resolver
2. 下沉 `CR-xxx` round bootstrap/resume service
3. 让 skill 改为调用正式 service/helper，而不是继续自己维护主逻辑

交付结果：

1. `run --review-loop delegated` 先支持 `task` scope
2. 能可靠分配/恢复 `CR-xxx`
3. review surface 与 round metadata 正式入账

### Phase B: Delegated Reviewer Runtime Loop

目标：

1. 正式把 reviewer delegation 放进 orchestration graph
2. 用结构化 `DelegatedReviewRequest` 替代 prompt truth
3. 让 `review / review-verify` 成为 loop worker

交付结果：

1. adopter 仓库可以在单次 `run` 中完成 delegated CR loop
2. 中断后可 resume 到正确 round
3. `reviewer` 角色真正成为产品级能力，而非 skill 假设

### Phase C: Delivery Checkpoint And Client Surfaces

目标：

1. clean round 后正式衔接 delivery rehearsal
2. 在 CLI pretty/session shell 中展示 loop state
3. 为未来 desktop client 保留同一 orchestration contract

交付结果：

1. scoped loop 与 controlled delivery 同链可回放
2. 用户可见当前 loop 处于：
   - implementation
   - review pending
   - fixing accepted findings
   - fresh recheck required
   - clean

### Phase D: Skill Thin-Wrapper Cutover

目标：

1. skill 退化为 ergonomic wrapper
2. prompt template 只保留为 adapter renderer 参考，不再是事实源
3. shell 脚本逐步退居测试/兼容层

## 8. 风险与对策

### 8.1 风险：把运行态 cache 当成治理真值

对策：

1. 明确 `CR-xxx` task card + review artifact + ledger 才是 canonical truth
2. round receipt 只做 resume/replay

### 8.2 风险：不同宿主的 reviewer handoff 语义不一致

对策：

1. 统一 `DelegatedReviewRequest`
2. adapter 只负责渲染，不改语义

### 8.3 风险：fresh recheck 和 same-round verify 混淆

对策：

1. 同一轮问题修复后的 closure 走 `review-verify`
2. 需要 reviewer 再看一轮时，必须新建 `CR-xxx`

### 8.4 风险：commit side effect 绕过政策闸口

对策：

1. commit/pr draft 只走 delivery rehearsal stage
2. 不再把 auto-commit 直接绑定到 skill 脚本

## 9. 验收标准

当以下条件同时满足时，可认为本方案达成一阶段目标：

1. 在 adopter 仓库中，用户可通过正式 Repo AI Governor 命令对 `task` scope 启动 delegated CR loop。
2. 每一轮 fresh reviewer pass 都会自动生成独立 `CR-xxx` task card。
3. round 发生中断后，工具可 resume 到正确的 open round，而不重开号码。
4. `review` / `review-verify` / ledger backfill 仍保持现有 canonical artifact 规则。
5. delegated reviewer 的请求由结构化 contract 驱动，而不是 repo-local markdown prompt 才能成立。
6. clean round 后若用户选择 `commit`，该动作通过 existing delivery rehearsal path 执行并进入 audit/replay。

## 10. 结论

`workspace-scoped-cr-loop` 已经证明：用户对“执行边界 + delegated review + fresh recheck + clean closeout + boundary delivery checkpoint”这一整套闭环是有真实需求的。

产品层下一步不该继续增加 skill 复杂度，而应把以下 4 项能力正式下沉：

1. scope resolver
2. `CR-xxx` round bootstrap/resume
3. delegated reviewer handoff contract
4. clean-round delivery checkpoint

这样，Repo AI Governor 才能真正把“本仓库里被 skill 验证过的治理工作流”，转成 adopter 仓库可安装、可调用、可恢复、可审计的正式产品能力。
