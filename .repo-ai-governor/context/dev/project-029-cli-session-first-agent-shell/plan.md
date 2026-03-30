# project-029-cli-session-first-agent-shell 计划

- Status: completed
- Date: 2026-03-30
- Stage Mapping: Session-first CLI shell formal follow-up
- Phase Mapping: Session shell foundation / Service-backed session runtime / Command handoff / Productization
- Upstream:
  - `.repo-ai-governor/draft/interactive-cli-session-first-agent-shell-technical-solution.md`
  - `.repo-ai-governor/draft/review-interactive-cli-session-first-agent-shell-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/adrs/session-first-shell-and-service-owned-session-state.md`

## 1. 目标

1. 将 `runtime.cli-interactive-shell` 从命令内 React shell 扩展为 session-first terminal shell。
2. 在不破坏既有显式子命令和 `pretty/plain/json` contract 的前提下，引入默认会话入口、主 agent 对话、slash command palette 与 resume baseline。
3. 将 canonical session state 收敛到 local orchestration service，避免 CLI / desktop 双轨状态分叉。
4. 以 follow-up project 的方式承接实现，并将本技术方案中除 desktop presenter / 窗口层本体外的其余 CLI / runtime 能力都收口到 `sprint-004` 结束。

## 2. Sprint 细化

## 2.1 sprint-001-entrypoint-session-shell-foundation

- Status: completed
- Sprint Goal: 完成默认入口分流、transcript shell 骨架、slash palette skeleton 与退出语义基线。
- Task Package: `TK-401`、`TK-402`、`TK-403`、`TK-404`。

## 2.2 sprint-002-main-agent-conversation-runtime

- Status: completed
- Sprint Goal: 完成主 agent conversation runtime、service-backed session DTO 与 resume baseline。
- Task Package: `TK-405`、`TK-406`、`TK-407`、`TK-408`。

## 2.3 sprint-003-command-handoff-and-hybrid-workflow

- Status: completed
- Sprint Goal: 完成 slash command handoff、command preview/confirm 与 transcript result summary。
- Task Package: `TK-409`、`TK-410`、`TK-411`、`TK-412`。

## 2.4 sprint-004-polish-and-session-productization

- Status: completed
- Sprint Goal: 完成剩余全部非-desktop CLI 能力收口，包括 session settings、`!` passthrough、`repo-ai-governor "query"` 初始 prompt 启动、多行/history/search、docs/help 收口与 desktop smoke baseline。
- Task Package: `TK-413`、`TK-414`、`TK-415`、`TK-416`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-401 | sprint-001 | 无子命令入口分流与 session-shell runner 基线 | cli/entry-shell | `.repo-ai-governor/draft/interactive-cli-session-first-agent-shell-technical-solution.md` | completed |
| TK-402 | sprint-001 | transcript / composer / prompt-bar React 组件 | cli/session-ui | TK-401 | completed |
| TK-403 | sprint-001 | slash command registry 与推荐过滤器 | cli/command-palette | TK-401,TK-402 | completed |
| TK-404 | sprint-001 | `stderr-only` / fallback / non-interactive contract 回归与退出语义固化 | verification/gates | TK-401,TK-402,TK-403 | completed |
| TK-405 | sprint-002 | `orchestration-service-client` session DTO 与 service-owned contract 基线 | runtime/session-contract | TK-404 | completed |
| TK-406 | sprint-002 | sidecar host session runtime 与 `session.main` route dispatch | runtime/session-runtime | TK-405 | completed |
| TK-407 | sprint-002 | CLI session client、transcript store、`/resume` 与顶层 `resume` 命令 | cli/session-resume | TK-405,TK-406 | completed |
| TK-408 | sprint-002 | 多轮对话、错误恢复、cancellation 与 desktop-ready streaming parity | runtime/session-parity | TK-406,TK-407 | completed |
| TK-409 | sprint-003 | `/init / connect / doctor / workspace / workflow` handoff | cli/command-handoff | TK-408 | completed |
| TK-410 | sprint-003 | `/run / plan / review` handoff 与 live-result bridge | cli/command-handoff | TK-409 | completed |
| TK-411 | sprint-003 | command preview / confirm / execute UX | cli/command-preview | TK-409,TK-410 | completed |
| TK-412 | sprint-003 | transcript 内 command result summary / artifact backlink | cli/session-reporting | TK-410,TK-411 | completed |
| TK-413 | sprint-004 | session settings commands 与 deferred command naming 收口 | cli/session-settings | TK-412 | completed |
| TK-414 | sprint-004 | multiline / history / search UX 与 `!` passthrough / `"query"` 启动入口 | cli/session-ux | TK-413 | completed |
| TK-415 | sprint-004 | i18n / help / docs / adoption playbook 与全能力可发现性收口 | docs/adoption | TK-413,TK-414 | completed |
| TK-416 | sprint-004 | desktop sidecar smoke baseline 与 session DTO packaged-surface 校验 | verification/desktop-smoke | TK-414,TK-415 | completed |

## 4. 依赖产物策略

1. `project-029` 启动默认消费：
   - `.repo-ai-governor/draft/interactive-cli-session-first-agent-shell-technical-solution.md`
   - `.repo-ai-governor/draft/review-interactive-cli-session-first-agent-shell-technical-solution.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-interactive-shell-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
2. 本项目承接实现与 rollout，不重复执行 promotion cutover。
3. 任务编号固定保留在 `TK-401 ~ TK-416`，避免与现有 `TK-3xx` active/planned stream 冲突。

## 5. DoD（project-029）

1. `repo-ai-governor` 已具备 session-first 本地人类入口。
2. 主 agent 对话、slash palette、resume baseline 与 command handoff 已进入受控 contract。
3. 除 desktop presenter / 窗口层本体外，本技术方案约定的其余 CLI / runtime 功能全部实现完成。
4. 上述“全部功能”明确包括：`!` shell passthrough、session settings commands、`/theme`、session routing setting command、`repo-ai-governor "query"` 初始 prompt 启动、多行/history/search。
5. CLI 与 future desktop 共享同一套 service-backed session state 语义。
6. adopter-facing docs、help surface、playbook 与最终 session-shell contract 同步收口。

## 6. 里程碑记录

1. 2026-03-30：创建 `project-029-cli-session-first-agent-shell`，作为 accepted session-first shell technical solution 的 planned follow-up stream。
2. 2026-03-30：预留 `TK-401 ~ TK-416` 号段，并拆解为四个 planned sprint，覆盖 foundation / runtime / handoff / productization。
3. 2026-03-30：根据确认后的执行口径，固定 `project-029` 的目标为“到 sprint-004 结束时，除 desktop presenter 本体外，其余非-desktop 功能全部收口”，不再把 `!`、`/theme`、`"query"` 启动入口继续视为 sprint-004 之后的后置项。
4. 2026-03-30：激活 `project-029 / sprint-001-entrypoint-session-shell-foundation`，将 `current-context.md` primary stream 从 `project-027 / sprint-003` closeout surface 切换到 session-first shell foundation。
5. 2026-03-30：完成 `TK-401 ~ TK-404`，实现无子命令默认 session-shell 入口、transcript/composer/prompt-bar React 组件、slash command metadata registry，以及 `/exit` / `Ctrl+C` / `Ctrl+D` 的退出语义与非交互 fallback regression。
6. 2026-03-30：激活 `project-029 / sprint-002-main-agent-conversation-runtime`，将 primary stream 切换到 service-backed session runtime，并开始执行 `TK-405 ~ TK-408`。
7. 2026-03-30：完成 `sprint-002-main-agent-conversation-runtime`，收口 service-backed session DTO、sidecar session runtime、top-level `resume` / in-session `/resume`、多轮恢复与 desktop-ready streaming parity，并修复 sidecar TS loader 对工作区包映射的缺口。
8. 2026-03-30：完成 `sprint-003-command-handoff-and-hybrid-workflow`，为 `/init / connect / doctor / workspace / workflow / run / plan / review` 提供 slash handoff、preview/confirm/cancel/execute UX，以及 transcript command result summary/backlink 基线。
9. 2026-03-30：完成 `sprint-004-polish-and-session-productization`，补齐 `/theme`、`/agent`、multiline/history/search、`!` passthrough、`repo-ai-governor "query"` 首轮 prompt 启动、README/playbook/i18n/help 收口与 desktop sidecar smoke baseline。
10. 2026-03-30：完成 [resolved code review](./sprint-004-polish-and-session-productization/review/resolved_code_review_project-029-full-implementation.md) 与 [project-029 completion audit summary](./project-029-cli-session-first-agent-shell-completion-audit-summary.md)，将 `project-029-cli-session-first-agent-shell` 切换为 `completed`；`current-context` 暂保留 `sprint-004` 作为 closeout surface，等待下一条主执行流显式激活。
11. 2026-03-30：`TK-421` 的 focused draft 在获批后已正式提升到 `runtime.cli-interactive-shell` 模块，新增 Ink-owned input ADR，并把 promotion evidence 回写到 `sprint-004` closeout ledger。
