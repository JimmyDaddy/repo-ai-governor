# TK-515 benchmark Codex-inspired desktop architecture and shell options

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P0
- Project: `project-041-desktop-surface-tech-selection-and-design`
- Sprint: `sprint-001-codex-reference-research-and-shell-selection`

## 1. 任务目标

基于官方资料对 `openai/codex`、Electron、Tauri 与 VS Code-family 的 desktop architecture pattern 做对比，形成适用于当前仓库约束的产品形态与宿主框架选择矩阵。

## 2. Depends On

1. `TK-514`

## 3. 预期产物

1. 对 `Codex-like app server`、`VS Code-family workbench`、`Electron shell`、`Tauri shell` 的结构化比较结论
2. 明确当前仓库下的推荐路径与 reject/backup 结论

## 4. Required Inputs

1. `https://github.com/openai/codex`
2. `https://openai.com/index/unlocking-the-codex-harness/`
3. `https://github.com/microsoft/vscode/wiki/source-code-organization`
4. `https://www.electronjs.org/docs/latest/tutorial/process-model`
5. `https://www.electronjs.org/docs/latest/tutorial/security`
6. `https://www.electronjs.org/docs/latest/api/utility-process`
7. `https://v2.tauri.app/concept/process-model/`
8. `https://v2.tauri.app/plugin/shell/`

## 5. Acceptance

1. 至少区分“产品形态选择”和“宿主框架选择”两个层面，而不是把它们混成一个问题。
2. 需要明确 `Codex` 参考的是“shared app server + thin client”模式，而不是直接照搬其底层语言或 native shell 实现。
3. 需要解释当前仓库为何更适合 `Electron now / Tauri later` 或相反，并显式写出判断依据。

## 6. Development Verification

1. 官方资料链接已核对，可回溯到原始页面

## 7. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-worktree-review-target.js`

## 8. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`。
2. 2026-04-04：完成官方资料收集，覆盖 `openai/codex` README、OpenAI App Server engineering article、Electron official process/security/utility-process docs、Tauri official process/shell docs 与 VS Code architecture wiki。
3. 2026-04-04：形成双层结论：产品形态优先走“Codex-like local agent cockpit / governance console”，宿主框架当前优先 `Electron + utility process + existing Node service host`；`Tauri` 保留为 service host 原生化或打包体积成为 P0 之后的下一阶段备选。

## 9. 产出

1. `.repo-ai-governor/draft/desktop-surface-technical-selection-and-design.md`
