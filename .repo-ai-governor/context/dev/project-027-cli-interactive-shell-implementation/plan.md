# project-027-cli-interactive-shell-implementation 计划

- Status: active
- Date: 2026-03-28
- Stage Mapping: Post-promotion implementation of `runtime.cli-interactive-shell`
- Phase Mapping: M1 Shell foundation / M2 Surface expansion / M3 Default cutover
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-interactive-shell-contract.md`
  - `.repo-ai-governor/draft/interactive-cli-react-style-technical-solution.md`

## 1. 目标

1. 将已正式化的 `runtime.cli-interactive-shell` contract 落地为可运行的 React 风格交互壳层。
2. 保持 `pretty/plain/json`、`--no-interactive` 与现有命令语义不变。
3. 先用 M1 建立 shell runner、mode resolver、`init` 基线，再逐步扩展到 `connect/workspace/workflow/upgrade`。
4. 把交互层、descriptor、bridge 与 runtime 之间的边界做成可测试、可回退、可默认切换的结构。

## 2. Sprint 细化

## 2.1 sprint-001-react-cli-shell-foundation

- Status: active
- Sprint Goal: 建立 React shell 的运行骨架、UI mode 解析、`stderr` 输出边界与 `init` 的最小可用交互闭环。
- Task Package: `TK-304`、`TK-305`、`TK-306`、`TK-307`。
- Exit Criteria:
  1. `--ui react` 的入口可解析并进入 shell runner。
  2. `--no-interactive`、非 TTY、`json/plain` 仍稳定回退到 `none`。
  3. `init` 的 React shell 能完成最小字段收集、确认与提交。
  4. `stderr` 渲染、`SIGINT` 清理与 classic fallback 有明确实现边界。

## 2.2 sprint-002-react-cli-shell-surface-expansion

- Status: planned
- Sprint Goal: 将 React shell 扩展到 `connect/workspace/workflow`，补齐 descriptor、i18n 与异步校验能力。
- Task Package: `TK-308`、`TK-309`、`TK-310`、`TK-311`。
- Exit Criteria:
  1. `connect` 与 `workspace` 的表单化路径接入 descriptor registry。
  2. `workflow` 子命令树与只读预览/编辑入口遵循正式 shell contract。
  3. i18n、locale 注入与异步校验行为有明确实现约束。

## 2.3 sprint-003-react-cli-shell-default-cutover

- Status: planned
- Sprint Goal: 完成默认切换策略、`upgrade` 收尾与文档/验证闭环，使 React shell 成为主要交互 surface。
- Task Package: `TK-312`、`TK-313`、`TK-314`、`TK-315`。
- Exit Criteria:
  1. `init` 的默认交互切换策略落地，且具备 classic fallback。
  2. `upgrade` 的确认、回滚参考与失败提示进入正式路径。
  3. 形成面向 adopter 的文档、playbook 与最终验收记录。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-304 | sprint-001 | project-027 激活与 React shell implementation handoff | bootstrap/governance | runtime.cli-interactive-shell contract, project-018 completion audit | planned |
| TK-305 | sprint-001 | shell runner、UI mode resolver 与 stderr/SIGINT baseline | runtime/shell-core | TK-304, contract.cli.interactive-shell.v1 | planned |
| TK-306 | sprint-001 | `init` React shell 最小向导与 descriptor/state baseline | cli/init-shell | TK-305, init-command, descriptor registry | planned |
| TK-307 | sprint-001 | M1 回归测试、fallback 与 non-interactive contract gate | verification/gates | TK-305, TK-306 | planned |
| TK-308 | sprint-002 | `connect/workspace` descriptor 化与表单映射扩展 | cli/connect-workspace | TK-307 | planned |
| TK-309 | sprint-002 | `workflow` 命令树注册与 preview/edit 只读壳层 | cli/workflow | TK-308, workflow command contract | planned |
| TK-310 | sprint-002 | locale / i18n 注入与异步校验策略 | shell/ux-infrastructure | TK-308, TK-309 | planned |
| TK-311 | sprint-002 | M2 回归测试与 surface-expansion gate | verification/gates | TK-308, TK-309, TK-310 | planned |
| TK-312 | sprint-003 | 默认切换策略与 `init` React 默认启用 | cli/default-cutover | TK-311 | planned |
| TK-313 | sprint-003 | `upgrade` 路径、确认层与 rollback reference polish | cli/upgrade | TK-312, upgrade command contract | planned |
| TK-314 | sprint-003 | adopter 文档、playbook 与 help surface 收尾 | docs/playbook | TK-312, TK-313 | planned |
| TK-315 | sprint-003 | project-027 出口验收与 completion audit | acceptance/closeout | TK-312, TK-313, TK-314 | planned |

## 4. 依赖产物策略

1. `project-027` 启动默认消费：
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-interactive-shell-contract.md`
   - `.repo-ai-governor/draft/interactive-cli-react-style-technical-solution.md`
2. `sprint-001` 先把 shell runtime 边界固定住，再推进 `init` shell 最小闭环。
3. `sprint-002` 才扩展到 `connect/workspace/workflow` 与 locale/i18n。
4. `sprint-003` 只在前两轮稳定后做默认切换和对外文档闭环。

## 5. DoD（project-027）

1. `runtime.cli-interactive-shell` 的 React shell 已有稳定运行骨架。
2. `--no-interactive`、非 TTY、`json/plain` 的 automation contract 零回归。
3. `init`、`connect`、`workspace`、`workflow`、`upgrade` 的交互 surface 按 M1/M2/M3 完成分层落地。
4. 默认切换策略、fallback 语义与测试门禁保持一致。
5. adopter 侧文档与最终 shell contract 不再漂移。

## 6. 里程碑记录

1. 2026-03-28：创建 `project-027-cli-interactive-shell-implementation`，承接 `runtime.cli-interactive-shell` 的 M1/M2/M3 任务拆解。
