# sprint-003-react-cli-shell-default-cutover 计划

- Status: completed
- Date: 2026-03-28
- Project: `project-027-cli-interactive-shell-implementation`

## 1. Sprint Goal

完成 `workflow create/edit/save`、DSL 编辑守护、`upgrade` 显式 React PoC 与对外帮助面收口，让 React shell 进入可默认扩面的完成态。

## 2. Task Package

1. `TK-312` `workflow` 命令家族注册与 create/edit 入口流（completed）
2. `TK-313` DSL 节点/连线/条件映射与 Loop guardrail 编辑（completed）
3. `TK-314` workflow 保存、compiled IR 验收与 `upgrade` 显式 React PoC（completed）
4. `TK-315` docs/help surface 收尾、project-027 出口验收与 completion audit（completed）
5. `TK-327` `workspace` clear-config 调试清理命令（completed）

## 3. Exit Criteria

1. `workflow create/edit/preview` 三态完整，支持 workspace 内保存流程配置。
2. `Sequential / Parallel / Loop / Condition` 节点、连线与条件分支可编辑，Loop 强制守护 `maxCycles` / `maxWallTimeSeconds`。
3. 保存后的流程定义能被编译器接受并产出可预览的 compiled IR；`upgrade` React shell 仍保持显式启用。
4. `connect/workspace` 默认 React、docs/help surface、completion audit 与 exit acceptance 同步收口。
5. 真实仓库调试时可通过 `workspace --workspace-action clear-config` 清理当前 workspace 配置，不必手动追踪 selector/config 残留。

## 4. Completion Notes

1. 这个 sprint 只在 M2 regression gate 全绿后开启，并把重点放在 `workflow create/edit/save` 与 DSL 编辑守护。
2. `upgrade` 在本 sprint 仍保持显式 React 启用，不与 `connect/workspace` 的默认扩面一起自动打开。
3. 2026-03-29：M2 regression gate 全绿后，已激活本 sprint 并开始执行 `TK-312`。
4. 2026-03-29：完成 `TK-312`，`workflow create/edit/preview` 显式子命令树、最小 create/edit 入口流与对应帮助面已落地。
5. 2026-03-29：完成 `TK-313` 与 `TK-314`，workflow editor runtime、workspace-local workflow save、compiled IR acceptance 与 `upgrade --ui react` PoC 已全部落地。
6. 2026-03-29：完成 `TK-315`，README/playbook/help surface、sprint exit acceptance 与 project completion audit 已同步收口。
7. 2026-03-29：sprint exit acceptance 证据：`.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-003-react-cli-shell-default-cutover/sprint-003-exit-acceptance-summary.md`。
8. 2026-03-29：基于真实仓库调试反馈补充 `TK-327`，新增 `workspace --workspace-action clear-config`，用于同步清理 repo-local selector config 与 active workspace config，降低重复验收残留状态干扰。
