# project-043-cli-session-shell-productization-rollout 计划

- Status: planned
- Date: 2026-04-04
- Stage Mapping: CLI session shell productization rollout
- Phase Mapping: Session lifecycle completeness / session projection and resume read model / adaptive interaction runtime / unified discoverability / session note / startup budget
- Upstream:
  - `.repo-ai-governor/context/dev/project-038-session-main-capability-explainer-productization/sprint-004-cli-borrowed-capabilities-rollout-decomposition/tasks/TK-529-decompose-cli-borrowed-capabilities-draft-into-planned-implementation-rollout-project-and-sprint-packages.md`
  - `.repo-ai-governor/draft/cli-borrowed-capabilities-productization-technical-solution.md`
  - `.repo-ai-governor/draft/cli-borrowing-analysis-against-claude-code-and-codex.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/module-overview.md`
  - `apps/cli/src/main.ts`
  - `apps/cli/src/runtime/interactive-shell/session-shell-service-client.ts`
  - `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`

## 1. 目标

1. 将 CLI 借鉴能力产品化技术方案从 draft 输入落成真实 implementation stream，而不再停留在“该借什么、怎么分阶段”的结论层。
2. 先补强 session lifecycle completeness 与 session projection/read-model，再补 adaptive interaction runtime 与 unified discoverability，最后补 session note 与 startup budget。
3. 在整个 rollout 中保持 service-owned truth、sqlite read-model、interactive shell presenter 与 entry lazy-load boundary 的模块分工，不新增 CLI-only shadow runtime。
4. 保持 `pretty/plain/json` 输出 contract、`stderr` live shell 边界与 i18n / ledger / review 治理要求不漂移。

## 2. Sprint 细化

## 2.1 sprint-001-session-lifecycle-and-read-model-foundation

- Status: planned
- Sprint Goal: 为 session shell 补齐 lifecycle action seam 与 session projection/read-model 基线。
- Task Package: `TK-530`、`TK-531`、`TK-532`。

## 2.2 sprint-002-adaptive-interaction-runtime-and-discoverability

- Status: planned
- Sprint Goal: 为 interactive shell 建立 adaptive interaction runtime policy，并让 skills/presets/builtins 进入统一 discoverability surface。
- Task Package: `TK-533`、`TK-534`、`TK-535`。

## 2.3 sprint-003-session-note-and-startup-budget

- Status: planned
- Sprint Goal: 为 session continuity 建立 lightweight session note，并给 session-first entry 建立 startup budget 与 lazy-load 治理。
- Task Package: `TK-536`、`TK-537`、`TK-538`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-530 | sprint-001 | freeze session lifecycle dto action seam and projection schema baseline | runtime/session-contract | active draft + cli session shell contract | planned |
| TK-531 | sprint-001 | implement session lifecycle service actions and sqlite-backed session projection read model | runtime/session-lifecycle-and-read-model | TK-530 | planned |
| TK-532 | sprint-001 | wire resume picker session list fork archive presenter and regression acceptance | cli/session-shell-lifecycle-presenter | TK-530、TK-531 | planned |
| TK-533 | sprint-002 | freeze adaptive interaction runtime policy and unified discoverability registry baseline | runtime/interaction-policy | active draft + cli session shell contract | planned |
| TK-534 | sprint-002 | implement alt-screen inline overlay fallback runtime and request-user-input seam | cli/interaction-runtime | TK-533 | planned |
| TK-535 | sprint-002 | add skills presets builtins unified discoverability registry presenter and regression acceptance | cli/discoverability-registry | TK-533、TK-534 | planned |
| TK-536 | sprint-003 | freeze session note trigger schema and startup budget instrumentation boundary | runtime/session-note-and-startup-contract | active draft + durable storage overview | planned |
| TK-537 | sprint-003 | implement session note persistence projection and session-shell startup lazy-load cutover | runtime/session-note-and-startup-implementation | TK-536 | planned |
| TK-538 | sprint-003 | add session note presenter startup diagnostics regression evidence and rollout closeout acceptance | cli/closeout-and-rollout | TK-536、TK-537 | planned |

## 4. 依赖产物策略

1. `project-043` 直接消费 `cli-borrowed-capabilities-productization-technical-solution` draft 作为 phased rollout 输入，但不把 draft 本身误报为 active formal contract。
2. `sprint-001` 必须先执行，因为 lifecycle completeness 与 read-model 是后续 runtime policy、discoverability 与 session note 的地基。
3. `sprint-002` 只在 `sprint-001` 给出可消费的 session list / lifecycle / projection seam 后启动，避免 presenter 层抢跑变成 shadow truth。
4. `sprint-003` 最后执行，因为 session note 与 startup budget 都依赖前两阶段已经冻结的 runtime / presenter 边界。
5. 所有 sprint 都必须遵守 `CS-021 / CS-033 / CS-034`：ledger 同步、用户可见文案走 i18n、代码窗口 closeout 需要真实 build evidence。

## 5. DoD（project-043）

1. CLI 已具备 `fork / archive / unarchive / compact planning` 的 service-owned lifecycle seam，并能从 session projection 驱动 `/resume` 与 recent list。
2. interactive shell 已具备统一的 `alt-screen / inline / overlay / fallback` 运行时策略，且不污染 `plain/json/non-interactive` contract。
3. repository-local skills、workflow presets、doctor presets、delivery presets 与 shell-local builtins 已能在统一 discoverability registry 中呈现，但仍保持受治理 truth 边界。
4. session note 已成为 presenter-safe continuity affordance，而不是不可见暗箱 memory。
5. 无子命令 session-first startup path 已建立明确的 lazy-load boundary 与 startup diagnostics。

## 6. 里程碑记录

1. 2026-04-04：`project-038 / sprint-003` 已完成 CLI 借鉴能力产品化技术方案草案，给出 phased rollout 与 deferred bucket。
2. 2026-04-04：用户进一步要求“继续拆成 implementation sprint/task package”，因此创建 `project-043-cli-session-shell-productization-rollout` 作为新的 planned follow-up stream。
3. 2026-04-04：已在 `current-context.md` 中登记 `project-043 / sprint-001` 为 planned follow-up stream，同时保持 `project-038 / sprint-004` 作为临时 closeout primary surface。
4. 2026-04-04：已将技术方案中的 3 个 phase 实体化为 `sprint-001 ~ sprint-003`，并拆成 `TK-530 ~ TK-538` 九个任务卡，后续可按 sprint 顺序直接激活执行。
