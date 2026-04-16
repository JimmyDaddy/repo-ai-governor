# Requirement-To-CR Governed Delivery Orchestration ADR

- Status: active
- Date: 2026-04-16
- Module ID: `runtime.orchestration`
- ADR ID: `adr.runtime.orchestration.requirement-to-cr-governed-delivery.v1`

## 1. Context

当前仓库已经分别拥有：

1. `technical-solution-drafting` / `technical-solution-review`
2. `workspace-task-decomposition`
3. task-driven `run`
4. `review / review-verify`
5. delegated CR loop 的 bootstrap 验证路径

但从产品视角看，这些能力仍然是分段存在的。用户给出一句高层需求后，系统缺少一条由 `session.main` 正式拥有的 requirement-to-CR 主路径，去稳定组织：

1. requirement capture 与 approved durable brief
2. technical-solution drafting / review
3. task decomposition preview / commit
4. execution / review / review-verify

如果不把这条链路 formalize，后续实现很容易重新发明：

1. 第二套 requirement registry
2. 第二套 solution/review truth
3. 第二套 task-plan pending state
4. 第二套 CR closure 状态

这会直接破坏现有 lifecycle / task ledger / review artifact 的 canonical ownership。

## 2. Decision

### 2.1 接受 `deliver` 为 parent orchestration capability

`runtime.orchestration` 正式接受：

1. `deliver` 是 requirement-to-CR governed delivery orchestration 的公开 capability id。
2. `deliver` 的 formal interaction model 固定为：
   - `interaction_model=ai_fixed_workflow`
   - `primary_entry=conversational_answer`
   - `backing_execution=templated_ai_workflow`
3. `/deliver` 只允许作为 discoverability alias，不得成为第二条 canonical truth surface。
4. `deliver` 是 parent orchestration capability，不替代 `plan / review / review_verify / run` 这些 child workflow。

### 2.2 固定最小 phase machine

正式 phase overlay 固定为：

1. `requirement_capture`
2. `requirement_review_pending`
3. `solution_drafting`
4. `solution_review_pending`
5. `task_decomposition_preview`
6. `task_plan_commit_pending`
7. `execution_active`
8. `review_pending`
9. `review_verify_pending`
10. `resolved`
11. `blocked`

### 2.3 固定 overlay-to-canonical truth mapping

每个 phase 都只能回链既有 canonical truth：

1. `requirement_capture`
   - 只允许停留在 shared-session preview，不形成 durable truth。
2. `requirement_review_pending`
   - 只允许引用 approved durable brief 或 explicit approval receipt；
   - 不得新建 requirement lifecycle registry。
3. `solution_review_pending`
   - authoritative truth 属于 `technical-solution-review` artifact 与 `technical-solution-lifecycle-registry.yaml`。
4. `task_decomposition_preview / task_plan_commit_pending`
   - authoritative truth 属于既有 plan preview/commit contract 与 sprint ledger。
5. `review_pending / review_verify_pending`
   - authoritative truth 属于 canonical `code_review_* / verified_* / resolved_*` 与配对 `CR-xxx`。
6. `resolved / blocked`
   - 只是 delivery workflow overlay summary，不得替代底层 sprint/task/review lifecycle。

### 2.4 固定 direct module boundary

本方案的 direct formal landing 限制在三处：

1. `runtime.orchestration`
   - producer，拥有 `deliver` capability、phase machine 与 child workflow orchestration truth
2. `runtime.durable-storage`
   - consumer，拥有 delivery workflow summary / artifact backlink / pending confirmation projection
3. `runtime.cli-interactive-shell`
   - consumer，拥有 discoverability、pending-state 与 transcript recap projection

以下模块只作为 imported dependency：

1. `runtime.agent-projection`
2. `governance.execution-gates`

除非后续出现新的 direct contract delta，否则它们不进入本轮 direct producer 清单。

### 2.5 固定 `delivery brief` 边界

`delivery brief` 的两段式边界正式冻结为：

1. `session preview`
2. `approved durable brief`

其中：

1. canonical producer 属于 `runtime.orchestration`
2. durable backlink / artifact metadata consumer 属于 `runtime.durable-storage`
3. human-readable landing 只允许进入 governed artifact surface；本轮不进入 normative manifest

## 3. Consequences

1. `runtime.orchestration` 需要把 `deliver` 纳入 capability interaction model truth。
2. `runtime.durable-storage` 需要为 delivery workflow summary、pending confirmation 与 artifact backlink 提供 presenter-safe durable projection。
3. `runtime.cli-interactive-shell` 需要把 `deliver` discoverability、phase summary 与 pending-state 作为 consumer-facing affordance 呈现，但不得在本地重算 lifecycle truth。
4. `deliver` 的 formalization 不等于代码已全部交付；真实实现与 rollout 继续由 `project-110-requirement-to-cr-delivery-orchestration-rollout` 承接。

## 4. Boundary Clarifications

### 4.1 这不是新增 raw orchestrator role

正确方向不是创建 `@orchestrator` raw role，而是让 `session.main` supervisor 拥有一条受治理的 fixed workflow。

### 4.2 这不是第二套 registry

`delivery brief`、phase summary 与 pending confirmation 都只能作为 orchestration overlay / durable backlink。
它们不能替代：

1. technical-solution lifecycle registry
2. task ledger
3. review artifact lifecycle

### 4.3 这不是让 presenter 成为 owner

CLI shell 只能消费：

1. phase summary
2. artifact backlinks
3. pending action hint

它不能重新拥有 `deliver` 的 phase truth、confirmation truth 或 CR closure truth。

## 5. Implementation Handoff

本 ADR 对应的正式 follow-up delivery 为：

1. `project-110-requirement-to-cr-delivery-orchestration-rollout`
2. sprint-001：deliver capability + approved durable brief baseline
3. sprint-002：task plan preview/commit + durable backlink projection
4. sprint-003：execution + governed CR orchestration
5. sprint-004：discoverability rollout + project closeout

## 6. Source Anchors

1. `.repo-ai-governor/draft/requirement-to-cr-governed-delivery-orchestration-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-109-requirement-to-cr-delivery-solution-review-and-promotion-prep/sprint-001-solution-review-and-promotion-handoff/review/approved_solution_review_requirement-to-cr-governed-delivery-orchestration.md`
3. `.repo-ai-governor/draft/session-main-plan-generation-and-ledger-commit-contract.md`
4. `.repo-ai-governor/draft/session-main-review-generation-verification-and-ledger-backfill-contract.md`
