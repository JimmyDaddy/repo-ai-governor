# project-031-session-shell-ink-input-productization 计划

- Status: planned
- Date: 2026-03-30
- Stage Mapping: Session-shell Ink-owned input productization follow-up
- Phase Mapping: activation and input baseline / action-driven runner / keyboard behaviors and live-input validation / default cutover and rollout closeout
- Upstream:
  - `.repo-ai-governor/draft/session-shell-ink-input-takeover-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/adrs/ink-owned-input-and-action-driven-session-shell.md`
  - `.repo-ai-governor/context/dev/project-029-cli-session-first-agent-shell/project-029-cli-session-first-agent-shell-completion-audit-summary.md`
  - `.repo-ai-governor/context/dev/project-029-cli-session-first-agent-shell/sprint-004-polish-and-session-productization/tasks/DA-421-session-shell-ink-input-technical-solution-promotion-cutover.md`

## 1. 目标

1. 将 `runtime.cli-interactive-shell` 的 session shell 从 `readline` 前台输入 ownership 演进到 Ink-owned input。
2. 把 `CliSessionShellRunner` 从阻塞式 `readLine()` 循环收口为 action-driven runner/runtime，支撑 live composer 与 slash palette。
3. 完成 `Up/Down`、`Tab`、`Esc`、`Ctrl+L`、paste / long input / CJK 输入的正式行为与测试闭环。
4. 在守住 `stderr-only`、service-owned session truth 与 fallback seam 的前提下完成默认 cutover，并同步文档、review 与 rollout evidence。

## 2. Sprint 细化

## 2.1 sprint-001-activation-and-ink-input-baseline

- Status: planned
- Sprint Goal: 激活 follow-up stream，并落地 Ink input baseline 所需的 runner/controller/live mount 骨架。
- Task Package: `TK-430`、`TK-431`、`TK-432`。

## 2.2 sprint-002-action-driven-runner-and-palette-state

- Status: planned
- Sprint Goal: 将 session shell 收口为 action-driven runner，并完成 composer / palette / handoff preview 的统一状态机。
- Task Package: `TK-433`、`TK-434`、`TK-435`。

## 2.3 sprint-003-keyboard-behaviors-and-live-input-validation

- Status: planned
- Sprint Goal: 收口 palette keyboard 行为、live input 边界条件与 Ink 测试 seam。
- Task Package: `TK-436`、`TK-437`、`TK-438`。

## 2.4 sprint-004-default-cutover-and-rollout-closeout

- Status: planned
- Sprint Goal: 完成默认 foreground input owner cutover，并收口文档、adoption、review 与 rollout 证据。
- Task Package: `TK-439`、`TK-440`、`TK-441`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-430 | sprint-001 | activate project-031 and sync Ink-input phase map | planning/governance | `DA-421-session-shell-ink-input-technical-solution-promotion-cutover.md` | planned |
| TK-431 | sprint-001 | add Ink runner and controller baseline for session shell | cli/session-shell-runtime | TK-430 | planned |
| TK-432 | sprint-001 | mount session-shell app as live Ink tree and preserve stderr-only contract | cli/session-shell-ui | TK-431 | planned |
| TK-433 | sprint-002 | refactor session-shell runner to consume action-driven input stream | runtime/session-shell-runner | TK-432 | planned |
| TK-434 | sprint-002 | unify composer palette and handoff preview state under controller actions | cli/session-shell-state | TK-433 | planned |
| TK-435 | sprint-002 | demote readline adapter to fallback seam and harden lifecycle cleanup | cli/fallback-lifecycle | TK-433,TK-434 | planned |
| TK-436 | sprint-003 | implement palette keyboard navigation completion and clear-screen semantics | cli/keyboard-behavior | TK-435 | planned |
| TK-437 | sprint-003 | add Ink live-input tests for paste long-input and CJK scenarios | verification/ink-input-tests | TK-436 | planned |
| TK-438 | sprint-003 | lock stderr-only fallback and output-contract regressions for live session shell | verification/output-contract | TK-436,TK-437 | planned |
| TK-439 | sprint-004 | switch default foreground input owner from readline to Ink | cli/cutover | TK-438 | planned |
| TK-440 | sprint-004 | update docs help and adoption guidance for Ink-owned session shell | docs/adoption | TK-439 | planned |
| TK-441 | sprint-004 | close review rollout evidence and completion audit for project-031 | docs/rollout | TK-439,TK-440 | planned |

## 4. 依赖产物策略

1. `project-031` 默认消费已经正式化的 `runtime.cli-interactive-shell` module docs，不再直接以 draft 作为唯一真值。
2. `project-029` 的 completed truth 保持不变；本项目只承接 Ink-owned input follow-up，不回写 project-029 的实现结论。
3. 任务编号固定保留在 `TK-430 ~ TK-441`，避免与 `project-030` 的 `TK-422 ~ TK-429` 发生冲突。

## 4.1 激活顺序建议

1. `project-031` 不作为当前最先执行的 follow-up stream；推荐在 `project-030 / sprint-002` 与 `sprint-003` 完成后再激活。
2. 原因是 Ink-owned input 改造会同时触达 runner、controller、palette、keyboard 行为与 fallback seam，爆炸半径大于 `project-030` 的 connect/apply 与 presenter 增强。
3. 待 `project-030` 先稳定 `connect -> doctor -> verify -> run --dry-run --trace` 的 adopter smoke gate，以及 shared `agentView` presenter 语义后，`project-031` 可以直接复用这些结果，降低并行返工风险。
4. 推荐跨项目顺序固定为 `project-030 / sprint-002 -> project-030 / sprint-003 -> project-031 / sprint-001~004 -> project-030 / sprint-004`。

## 5. DoD（project-031）

1. session shell 的默认 foreground input owner 已切换为 Ink，`readline` 仅保留 fallback 角色。
2. runner/controller/palette/composer 的 action-driven 输入模型已稳定落地。
3. `Up/Down`、`Tab`、`Esc`、`Ctrl+L`、paste / long input / CJK 等 live-input 行为具备正式测试覆盖。
4. `stderr-only`、service-owned session truth 与 fallback contract 未被破坏。
5. docs、review、rollout evidence 与 completion audit 已同步收口。

## 6. 里程碑记录

1. 2026-03-30：基于已正式提升的 Ink-owned input ADR 创建 `project-031-session-shell-ink-input-productization` 作为新的 planned follow-up stream。
2. 2026-03-30：完成与 `project-030` 的跨项目排序复核，结论为 `project-031` 在 `project-030 sprint-002/003` 之后激活，并在其 cutover 稳定后再回到 `project-030 sprint-004`。
