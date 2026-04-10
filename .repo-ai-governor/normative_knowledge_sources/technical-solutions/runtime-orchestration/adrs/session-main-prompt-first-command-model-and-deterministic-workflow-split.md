# Session Main Prompt-First Command Model And Deterministic Workflow Split ADR

- Status: active
- Date: 2026-04-10
- Module ID: `runtime.orchestration`
- ADR ID: `adr.runtime.orchestration.session-main-prompt-first-command-model.v1`

## 1. Context

`session.main` 当前已经拥有 capability catalog、natural-language skill routing、slash discoverability 与 role/subagent direction，但公开命令语义仍存在明显失真：

1. `/plan` 这个名字更像“让 AI 生成计划”，当前实现却主要承载 ledger preview/commit。
2. `/review verify` 的核心价值是“让 AI 复核 CR 报告 / review artifact”，但它很容易被误读成普通 deterministic verify。
3. `run` 已公开存在，但当前公开语义不足以解释“为什么在各命令已有执行流的前提下，还要单独保留一个 `/run`”。
4. public `/verify` 与 `connect`、`doctor` 的职责边界过度重叠，且与 `/review verify` 形成命名冲突。
5. 原始 `@planner / @reviewer / ...` role mention 已存在，但 discoverability 太弱，不应成为标准任务的唯一主入口。

如果不把这层分工正式化，后续 capability catalog、routing、slash palette、help appendix、PRD 与 formal docs 会继续对同一能力给出互相冲突的入口语义。

## 2. Decision

1. `runtime.orchestration` 正式接受一条 service-owned `session.main` command model split：
   - `raw_role_entry`
   - `ai_fixed_workflow`
   - `deterministic_utility`
   - `pending_existence_review`
   - `explain_only`
2. `@planner / @architect / @reviewer / @verifier` 保留为 expert-only raw role entry；它们不是 slash bridge，也不取代标准能力命令的主入口。
3. `plan / review / review_verify` 正式建模为 `ai_fixed_workflow`：
   - `/plan <goal>` 是产品化 planning workflow
   - `/review` 是 governed review start workflow
   - `/review verify` 是 AI 复核 CR 报告 / review artifact / 修复结果的固定工作流
4. `plan_sync / workflow / connect / doctor / workspace.switch_branch` 正式建模为 `deterministic_utility`。
5. `run` 在本轮不删除，但正式进入 `pending_existence_review`：
   - rollout 必须证明其 public value
   - public wording 必须收窄到 reusable governed workflow / task-driven execution flow
   - generic “帮我做/帮我实现” 意图不再默认桥接到 `/run`
6. public `/verify` 被正式删除：
   - 它不再进入 governed capability catalog、session-shell slash discoverability 与 public CLI command surface
   - underlying readiness checks 继续由 `connect` follow-up、`doctor` mode 与 internal gate 承接
   - `runtime.agent-projection` 的 onboarding / binding / `AgentDescriptor` projection seam 继续有效，不因 public command removal 被抹除
7. `runtime.orchestration` 新增 capability interaction model contract，并作为这套 command model 的唯一 formal source of truth。
8. `runtime.cli-interactive-shell` 只消费该 contract，在 module overview / session-shell contract / slash discoverability wording 中体现 raw role、AI fixed workflow、deterministic utility 与 removed `/verify` 的 presenter 边界。

## 3. Consequences

1. capability catalog、natural-language routing 与 slash discoverability 必须共享同一套 interaction model vocabulary。
2. `/plan` 不再被允许以“裸 CLI bridge to legacy plan preview/commit”方式作为前台默认心智存在；`/plan sync` 才是 deterministic ledger action。
3. `/review verify` 不再与 generic `verify` 共享命名语义；它必须明确属于 review lifecycle。
4. public `/verify` 删除会触发 triad 与 architecture sync，因为 PRD/overall/architecture 中的公开 onboarding wording 需要改写为 `connect / doctor + readiness gate`。
5. `run` 的保留不再是默认合理化结论，而是需要在 rollout 中给出独立 evidence 和 narrowed wording。
6. formal promotion 时，`runtime.orchestration` 负责新增 ADR + contract，`runtime.cli-interactive-shell` 只做 consumer-facing amendments；`runtime.agent-projection` 与 `runtime.durable-storage` 记录为受影响模块，但默认不新增 parallel formal docs。

## 4. Rollout Notes

1. 本 ADR 定义的是正式 command model，并不宣称所有 code-path 已在同一窗口全面交付。
2. 具体 rollout 由 `project-077-session-main-command-model-rollout` 承接，并分为 capability model cutover、review workflow + verify removal、run scope resolution、regression migration closeout 四个 implementation sprint。
3. 在 rollout 完成前，legacy `repo-ai-governor plan --output pretty` 仍可保留为 compatibility surface，但 help/discoverability 必须诚实标注为 legacy deterministic planning sync。
