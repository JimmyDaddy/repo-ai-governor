# project-027-cli-interactive-shell-implementation 计划

- Status: completed
- Date: 2026-03-28
- Stage Mapping: Post-promotion implementation of `runtime.cli-interactive-shell`
- Phase Mapping: M1 Shell foundation / M2 Shared shell expansion & preview / M3 Workflow editing, default expansion & closeout
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-interactive-shell-contract.md`
  - `.repo-ai-governor/draft/interactive-cli-react-style-technical-solution.md`

## 1. 目标

1. 将已正式化的 `runtime.cli-interactive-shell` contract 落地为可运行的 React 风格交互壳层。
2. 保持 `pretty/plain/json`、`--no-interactive` 与现有命令语义不变。
3. 先用 M1 建立 shell runner、mode resolver、`init` 基线，再用 M2 完成共享 descriptor/shell 框架与 `workflow preview`，最后在 M3 收口 `workflow create/edit/save`、`upgrade` 显式 PoC 与默认扩面。
4. 把交互层、descriptor、bridge 与 runtime 之间的边界做成可测试、可回退、可默认切换的结构。

## 2. Sprint 细化

## 2.1 sprint-001-react-cli-shell-foundation

- Status: completed
- Sprint Goal: 建立 React shell 的运行骨架、UI mode 解析、`stderr` 输出边界与 `init` 的最小可用交互闭环。
- Task Package: `TK-304`、`TK-305`、`TK-306`、`TK-307`。
- Exit Criteria:
  1. `--ui react` 的入口可解析并进入 shell runner。
  2. `--no-interactive`、非 TTY、`json/plain` 仍稳定回退到 `none`。
  3. `init` 的 React shell 能完成最小字段收集、确认与提交。
  4. `stderr` 渲染、`SIGINT` 清理与 classic fallback 有明确实现边界。

## 2.2 sprint-002-react-cli-shell-surface-expansion

- Status: completed
- Sprint Goal: 固化共享 descriptor/shell 框架，接入 `connect/workspace`，让 `init` 默认走 React，并先把 `workflow` 做成只读预览。
- Task Package: `TK-308`、`TK-309`、`TK-310`、`TK-311`。
- Exit Criteria:
  1. `init/connect/workspace` 共享同一套 descriptor registry、字段渲染器、步骤推进器与 help/error/footer。
  2. `init` 在 `TTY + pretty + interactive` 下默认走 React，并保留明确的 classic fallback 与错误提示策略。
  3. `workflow preview` 提供模板选择、流程摘要与 compiled IR 预览，但不改写流程文件。
  4. M2 regression gate 锁定 `stderr-only`、`pretty/plain/json`、非 TTY 与 `--no-interactive` contract。

## 2.3 sprint-003-react-cli-shell-default-cutover

- Status: completed
- Sprint Goal: 完成 `workflow create/edit/save`、DSL 编辑守护、`upgrade` 显式 React PoC 与对外帮助面收口，让 React shell 进入可默认扩面的完成态。
- Task Package: `TK-312`、`TK-313`、`TK-314`、`TK-315`、`TK-327`、`TK-328`、`TK-329`、`TK-330`、`TK-331`、`TK-332`、`TK-333`、`TK-334`。
- Exit Criteria:
  1. `workflow create/edit/preview` 三态完整，支持 workspace 内保存流程配置。
  2. `Sequential / Parallel / Loop / Condition` 节点、连线与条件分支可编辑，Loop 强制守护 `maxCycles` / `maxWallTimeSeconds`。
  3. 保存后的流程定义能被编译器接受并产出可预览的 compiled IR；`upgrade` React shell 仍保持显式启用。
4. `connect/workspace` 默认 React、docs/help surface、completion audit 与 exit acceptance 同步收口。
5. 真实仓库调试时可通过 `workspace --workspace-action clear-config` 清理当前 workspace 配置，不必手动定位 repo-local selector 与 active workspace config。
6. React shell 主题支持通过工作区配置持久化默认值，用户无需在每次执行时重复传入 `--ui-theme`。
7. `workspace` 允许使用更短的人类友好命令面：`workspace <action> [value]`，同时保持 `--workspace-action` 兼容现有脚本。
8. 在 `tool_managed` 模式下执行 `workspace set-ui-theme` 时，不得因为主题持久化而无端新建仓库内 repo-local selector config。
9. React shell 主题解析必须固定为“命令 `--ui-theme` 强制覆盖 > workspace 持久化默认值 > 全局 CLI 默认值”，并通过 `workspace set-ui-theme <preset> --theme-scope global` 提供正式的全局入口。
10. 顶层人类友好入口 `set-ui-theme <preset>` 应默认作用于全局 CLI 主题，而 `workspace set-ui-theme <preset>` 继续默认作用于当前 workspace。
11. 用户必须能通过帮助面直接查看可用主题，并在交互式 TTY + `pretty` 模式下通过不带 `[theme]` 的 `set-ui-theme` / `workspace set-ui-theme` 打开 selector。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-304 | sprint-001 | project-027 激活与 React shell implementation handoff | bootstrap/governance | runtime.cli-interactive-shell contract, project-018 completion audit | completed |
| TK-305 | sprint-001 | shell runner、UI mode resolver 与 stderr/SIGINT baseline | runtime/shell-core | TK-304, contract.cli.interactive-shell.v1 | completed |
| TK-306 | sprint-001 | `init` React shell 最小向导与 descriptor/state baseline | cli/init-shell | TK-305, init-command, descriptor registry | completed |
| TK-307 | sprint-001 | M1 回归测试、fallback 与 non-interactive contract gate | verification/gates | TK-305, TK-306 | completed |
| TK-308 | sprint-002 | 共享 descriptor registry、字段渲染器与步骤引擎基线 | shell/shared-foundation | TK-307, contract.cli.interactive-shell.v1 | completed |
| TK-309 | sprint-002 | connect/workspace 共享壳层接入与 help/error/footer 统一 | cli/connect-workspace | TK-308 | completed |
| TK-310 | sprint-002 | `init` 默认 React 路由与 classic fallback 体验策略 | cli/init-default-routing | TK-308, TK-309 | completed |
| TK-311 | sprint-002 | `workflow preview` 只读摘要与 M2 回归 gate | cli/workflow-preview | TK-309, TK-310 | completed |
| TK-312 | sprint-003 | `workflow` 命令家族注册与 create/edit 入口流 | cli/workflow-command-family | TK-311 | completed |
| TK-313 | sprint-003 | DSL 节点/连线/条件映射与 Loop guardrail 编辑 | cli/workflow-editor | TK-312 | completed |
| TK-314 | sprint-003 | workflow 保存、compiled IR 验收与 `upgrade` 显式 React PoC | cli/workflow-save-upgrade | TK-312, TK-313 | completed |
| TK-315 | sprint-003 | docs/help surface 收尾、project-027 出口验收与 completion audit | acceptance/docs-closeout | TK-314 | completed |
| TK-327 | sprint-003 | `workspace` clear-config 调试清理命令 | cli/workspace-debug-reset | TK-315 | completed |
| TK-328 | sprint-003 | `workspace` React shell 主题持久化入口 | cli/workspace-theme-config | TK-315, TK-327 | completed |
| TK-329 | sprint-003 | `workspace --help` 帮助面可发现性修复 | cli/help-surface | TK-327, TK-328 | completed |
| TK-330 | sprint-003 | `workspace <action> [value]` 人类友好短写入口 | cli/workspace-command-ux | TK-327, TK-328, TK-329 | completed |
| TK-331 | sprint-003 | `set-ui-theme` tool-managed selector 意外创建回归修复 | cli/workspace-theme-regression | TK-328, TK-330 | completed |
| TK-332 | sprint-003 | React shell 主题全局/workspace/命令三层优先级 | cli/workspace-theme-layering | TK-328, TK-330, TK-331 | completed |
| TK-333 | sprint-003 | 顶层 `set-ui-theme` 快捷入口默认全局语义 | cli/workspace-theme-top-level-shortcut | TK-330, TK-332 | completed |
| TK-334 | sprint-003 | `set-ui-theme` 主题可发现性与 selector 入口 | cli/workspace-theme-selector-discovery | TK-329, TK-330, TK-333 | completed |

## 4. 依赖产物策略

1. `project-027` 启动默认消费：
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-interactive-shell-contract.md`
   - `.repo-ai-governor/draft/interactive-cli-react-style-technical-solution.md`
2. `sprint-001` 先把 shell runtime 边界固定住，再推进 `init` shell 最小闭环。
3. `sprint-002` 聚焦共享 descriptor registry、字段渲染器、help/error/footer、`init` 默认路由与 `workflow preview` 只读预览，并统一以 `ink@6.8.0 + @inkjs/ui@2.0.0` 作为 React CLI UI 底座。
4. `sprint-003` 只在 M2 gate 稳定后推进 `workflow create/edit/save`、Loop guardrail、`upgrade` 显式 PoC 与对外文档闭环。

## 5. DoD（project-027）

1. `runtime.cli-interactive-shell` 的 React shell 已有稳定运行骨架。
2. `--no-interactive`、非 TTY、`json/plain` 的 automation contract 零回归。
3. `init` 默认路由、`connect/workspace` 共享壳层、`workflow preview/create/edit/save` 按 M1/M2/M3 完成分层落地。
4. `workflow` DSL guardrail、compiled IR 验收、`upgrade` 显式 React PoC 与默认扩面策略保持一致，且交互壳层统一落在 `ink@6.8.0 + @inkjs/ui@2.0.0` 的受控依赖面上。
5. adopter 侧文档、help surface、playbook 与最终 shell contract 不再漂移。

## 6. 里程碑记录

1. 2026-03-28：创建 `project-027-cli-interactive-shell-implementation`，承接 `runtime.cli-interactive-shell` 的 M1/M2/M3 任务拆解。
2. 2026-03-28：完成 `sprint-001-react-cli-shell-foundation`，落地 `--ui react` 实验入口、`ui_mode` resolver、stderr-only `init` minimal wizard 与回归测试基线。
3. 2026-03-28：将剩余 M2/M3 重新对齐到 shared shell -> workflow preview -> workflow edit/save -> closeout 的拆解路径，并登记 `sprint-002` / `sprint-003` follow-up streams。
4. 2026-03-28：联网核对 npm 最新可用版本后，将 React CLI UI 底座锁定为 `ink@6.8.0` 与 `@inkjs/ui@2.0.0`，后续任务默认按该组合落地。
5. 2026-03-28：激活 `sprint-002-react-cli-shell-surface-expansion`，开始执行 `TK-308` 的依赖接入与共享壳层骨架。
6. 2026-03-28：完成 `TK-309`，`connect/workspace` 已切入共享 descriptor/shell 基线，并统一了 help/error/footer 与 i18n runtime 接线。
7. 2026-03-29：完成 `TK-311` 并关闭 `sprint-002`，M2 regression gate 已稳定覆盖 `workflow preview` 与共享壳层 contract。
8. 2026-03-29：激活 `sprint-003-react-cli-shell-default-cutover`，开始执行 `TK-312` 的 `workflow create/edit/preview` 显式入口流。
9. 2026-03-29：完成 `TK-313`，workflow editor runtime 已统一 node/edge/condition branch 映射与 Loop guardrail/conditionKey 语义守护。
10. 2026-03-29：完成 `TK-314`，`workflow create/edit` 已支持 workspace-local persistence 与 compiled IR snapshot，`upgrade --ui react` 也已接入共享 React shell PoC。
11. 2026-03-29：完成 `TK-315`，adopter-facing docs/help/playbook 已同步收口，并新增 `project-027-completion-audit-summary.md` 作为项目完成态审计摘要。
12. 2026-03-29：项目完成态审计摘要回链：`.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/project-027-completion-audit-summary.md`。
13. 2026-03-29：基于真实仓库调试反馈补充 `TK-327`，新增 `workspace --workspace-action clear-config` 用于一次性清理当前 repo-local selector config 与 active workspace config，降低重复验收/回放时的残留状态干扰。
14. 2026-03-29：根据真实用户终端反馈补齐 `init` React shell 的 live rerender 收口；`CliInitReactShellInkPromptAdapter` 已切换为单实例 `Ink.rerender()` 驱动，真实 TTY 验收确认步骤与状态切换都在同一展示区刷新。
15. 2026-03-30：根据用户“主题应可配置且要有正式入口”的反馈补充 `TK-328`，新增 `workspace --workspace-action set-ui-theme`、`ui.react.theme` 持久化默认值与 adopter-facing 文档入口。
16. 2026-03-30：根据真实用户反馈补充 `TK-329`，修复 `workspace --help` 只显示空壳描述的问题，补齐子命令级选项、动作说明与可复制示例。
17. 2026-03-30：根据用户“workspace 命令执行太繁琐”的反馈补充 `TK-330`，新增 `workspace <action> [value]` 短写入口，支持 `clear-config`、`set-ui-theme calm`、`rollback <plan-path>` 等更短的人类友好写法，并保留旧 flags 语法兼容脚本。
18. 2026-03-30：根据真实用户反馈补充 `TK-331`，修复 `tool_managed` 模式下执行 `workspace set-ui-theme` 会错误在仓库内新建 `.repo-ai-governor/governor.yaml` 的回归；现在只会写 active workspace config，并仅在 repo-local selector 已存在时才同步它。
19. 2026-03-30：根据用户“主题设置应为全局 + workspace + 命令强制三层”的反馈补充 `TK-332`，新增全局 CLI 主题偏好文件、`workspace set-ui-theme --theme-scope global` 入口，并将 React shell 主题优先级固定为命令覆盖 > workspace 默认值 > 全局默认值。
20. 2026-03-30：根据用户“`pnpm exec repo-ai-governor set-ui-theme calm` 应默认设置全局主题”的反馈补充 `TK-333`，新增顶层 `set-ui-theme` 快捷入口并将其默认 scope 收敛为 global，同时保留 `workspace set-ui-theme` 的 workspace 默认语义。
21. 2026-03-30：根据用户“如何查看可用 theme，以及能否做成 selector”的反馈补充 `TK-334`，帮助面已增加主题清单与 selector 提示，并让交互式 TTY + `pretty` 模式下省略 `[theme]` 直接进入 React shell selector。
