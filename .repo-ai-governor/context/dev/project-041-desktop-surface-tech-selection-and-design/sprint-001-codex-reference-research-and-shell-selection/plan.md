# sprint-001-codex-reference-research-and-shell-selection 计划

- Status: active
- Date: 2026-04-04
- Project: `project-041-desktop-surface-tech-selection-and-design`
- Sprint Goal: 结合 `openai/codex` 与官方 desktop framework 资料，产出 Repo AI Governor 桌面端的产品形态、宿主框架与 MVP 架构推荐。

## 1. Task Package

1. `TK-514` activate project-041 and freeze desktop planning constraints
2. `TK-515` benchmark Codex-inspired desktop architecture and shell options
3. `TK-516` author desktop technical selection and phased design baseline
4. `TK-517` convert selected direction into MVP implementation task package and activation handoff

## 2. Exit Criteria

1. 已明确桌面端不是新的 runtime owner，而是既有 local orchestration service 的 client surface。
2. 已明确产品形态优先为“governance console / agent cockpit”，而不是直接复制 VS Code-family 的 full IDE workbench。
3. 已完成 `Electron`、`Tauri` 与 VS Code-family 路线的对比，并给出当前推荐结论。
4. 已输出一份包含内部约束、外部来源、架构草图、阶段路线和风险 register 的选型文档。
5. `TK-517` 已作为 active handoff 任务保留在本 sprint 中，用于把当前结论转成下一条实现型 stream/sprint 的激活包，但不在本 sprint 内直接展开桌面端工程实现。

## 3. Milestones

1. 2026-04-04：创建 `sprint-001` skeleton，并冻结 `TK-514` ~ `TK-517` 作为桌面端选型 planning package。
2. 2026-04-04：完成 `TK-514`，已在 `current-context.md` 中挂入并行 active stream，同时保留既有 primary closeout surface 不变。
3. 2026-04-04：完成 `TK-515`，已汇总 `openai/codex`、OpenAI App Server engineering article、Electron official docs、Tauri official docs 与 VS Code architecture wiki。
4. 2026-04-04：完成 `TK-516`，已产出 `.repo-ai-governor/draft/desktop-surface-technical-selection-and-design.md` 并冻结本轮推荐架构。
5. 2026-04-04：将 `TK-517` 维持为 active handoff 任务，用于把当前选型结论转成实现型 stream/sprint 的激活包。
