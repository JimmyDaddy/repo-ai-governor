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
6. `TK-328` `workspace` React shell 主题持久化入口（completed）
7. `TK-329` `workspace --help` 帮助面可发现性修复（completed）
8. `TK-330` `workspace <action> [value]` 人类友好短写入口（completed）
9. `TK-331` `set-ui-theme` tool-managed selector 意外创建回归修复（completed）
10. `TK-332` React shell 主题全局/workspace/命令三层优先级（completed）
11. `TK-333` 顶层 `set-ui-theme` 快捷入口默认全局语义（completed）
12. `TK-334` `set-ui-theme` 主题可发现性与 selector 入口（completed）

## 3. Exit Criteria

1. `workflow create/edit/preview` 三态完整，支持 workspace 内保存流程配置。
2. `Sequential / Parallel / Loop / Condition` 节点、连线与条件分支可编辑，Loop 强制守护 `maxCycles` / `maxWallTimeSeconds`。
3. 保存后的流程定义能被编译器接受并产出可预览的 compiled IR；`upgrade` React shell 仍保持显式启用。
4. `connect/workspace` 默认 React、docs/help surface、completion audit 与 exit acceptance 同步收口。
5. 真实仓库调试时可通过 `workspace --workspace-action clear-config` 清理当前 workspace 配置，不必手动追踪 selector/config 残留。
6. React shell 主题可通过 `workspace --workspace-action set-ui-theme` 与 `ui.react.theme` 持久化默认值，不必在每次命令上重复传入 `--ui-theme`。
7. `workspace --help` 必须能直接展示关键参数、动作说明与示例，帮助面本身可作为真实仓库调试入口。
8. `workspace` 需要提供更短的人类友好执行入口，支持 `workspace clear-config`、`workspace set-ui-theme calm`、`workspace rollback <plan-path>` 这类短写，同时保持旧 flags 兼容。
9. `workspace set-ui-theme` 在 `tool_managed` 模式下只应更新 active workspace config；repo-local selector 只有在原本已存在时才允许同步，不得凭空创建。
10. React shell 主题解析必须遵循“命令 `--ui-theme` > workspace 默认值 > 全局 CLI 默认值”，并通过 `workspace set-ui-theme <preset> --theme-scope global` 提供全局入口。
11. 顶层 `set-ui-theme <preset>` 快捷入口必须默认设置全局 CLI 主题；若要仅影响当前 workspace，用户需显式传 `--theme-scope workspace` 或继续使用 `workspace set-ui-theme`。
12. 用户必须能直接查看可用主题列表，并在交互式 TTY + pretty 模式下通过不带 `[theme]` 的 `set-ui-theme` / `workspace set-ui-theme` 打开 selector。

## 4. Completion Notes

1. 这个 sprint 只在 M2 regression gate 全绿后开启，并把重点放在 `workflow create/edit/save` 与 DSL 编辑守护。
2. `upgrade` 在本 sprint 仍保持显式 React 启用，不与 `connect/workspace` 的默认扩面一起自动打开。
3. 2026-03-29：M2 regression gate 全绿后，已激活本 sprint 并开始执行 `TK-312`。
4. 2026-03-29：完成 `TK-312`，`workflow create/edit/preview` 显式子命令树、最小 create/edit 入口流与对应帮助面已落地。
5. 2026-03-29：完成 `TK-313` 与 `TK-314`，workflow editor runtime、workspace-local workflow save、compiled IR acceptance 与 `upgrade --ui react` PoC 已全部落地。
6. 2026-03-29：完成 `TK-315`，README/playbook/help surface、sprint exit acceptance 与 project completion audit 已同步收口。
7. 2026-03-29：sprint exit acceptance 证据：`.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-003-react-cli-shell-default-cutover/sprint-003-exit-acceptance-summary.md`。
8. 2026-03-29：基于真实仓库调试反馈补充 `TK-327`，新增 `workspace --workspace-action clear-config`，用于同步清理 repo-local selector config 与 active workspace config，降低重复验收残留状态干扰。
9. 2026-03-30：根据用户主题化反馈补充 `TK-328`，新增 `workspace --workspace-action set-ui-theme`，并让 `ui.react.theme` 成为 React shell 默认主题的持久化入口；README 与本地采用手册已同步更新。
10. 2026-03-30：根据用户帮助面反馈补充 `TK-329`，`workspace --help` 已改为展示子命令选项、动作说明与可复制示例，不再只有空壳描述。
11. 2026-03-30：根据用户命令繁琐反馈补充 `TK-330`，`workspace` 已支持 `workspace <action> [value]` 短写入口；README / playbook / help surface 已同步切换到更短示例，同时保留 `--workspace-action` 兼容路径。
12. 2026-03-30：根据用户回归反馈补充 `TK-331`，修复 `tool_managed` 模式下 `workspace set-ui-theme` 会错误创建 repo-local selector config 的问题，并补齐命令层回归测试。
13. 2026-03-30：根据用户“主题应支持全局 + workspace + 命令强制三层”的反馈补充 `TK-332`，新增全局 CLI 主题偏好文件、`--theme-scope global` 入口，并将运行时主题优先级固定为命令覆盖 > workspace 默认值 > 全局默认值。
14. 2026-03-30：根据用户“顶层 `set-ui-theme` 应默认设置全局主题”的反馈补充 `TK-333`，新增顶层快捷入口，并将其默认 scope 调整为 global；`workspace set-ui-theme` 继续默认 workspace。
15. 2026-03-30：根据用户“如何查看可用 theme，以及能否做成 selector”的反馈补充 `TK-334`，帮助面已补齐主题清单，交互式 TTY + pretty 模式下省略 `[theme]` 会直接打开 selector。
