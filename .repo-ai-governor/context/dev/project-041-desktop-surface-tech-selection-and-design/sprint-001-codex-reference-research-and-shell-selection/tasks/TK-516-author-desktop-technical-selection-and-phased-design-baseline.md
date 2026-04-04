# TK-516 author desktop technical selection and phased design baseline

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P0
- Project: `project-041-desktop-surface-tech-selection-and-design`
- Sprint: `sprint-001-codex-reference-research-and-shell-selection`

## 1. 任务目标

将本轮调研与仓库约束沉淀为一份正式的桌面端选型与设计文档，作为后续桌面端实现和方案评审的统一起点。

## 2. Depends On

1. `TK-515`

## 3. 预期产物

1. 一份桌面端选型文档，明确推荐产品形态、宿主框架、运行时边界、阶段路线与主要风险

## 4. Required Inputs

1. `TK-514`
2. `TK-515`
3. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
4. `integrations/desktop/README.md`
5. `integrations/desktop/examples/README.md`
6. `docs/support-matrix.md`

## 5. Acceptance

1. 文档中必须显式回链到当前仓库已有的 desktop baseline，而不是把外部产品假设直接覆盖本仓库真值。
2. 文档中必须给出至少一张架构草图和一个阶段性落地路线。
3. 文档中必须解释“为什么不是现在就走 full IDE fork / Tauri / pure chat shell”。
4. 文档中必须列出外部来源与检索日期。

## 6. Development Verification

1. docs-only change；未修改 `apps/**`、`packages/**`、`bin/**`、`test/**`

## 7. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-worktree-review-target.js`

## 8. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`。
2. 2026-04-04：产出 `.repo-ai-governor/draft/desktop-surface-technical-selection-and-design.md`，结论冻结为：
   - 产品形态：先做 local orchestration service 的 desktop governance console / agent cockpit，不做 full IDE fork。
   - MVP shell：首选 `Electron + React + utility process sidecar`。
   - 长期备选：待 service host 原生可执行化或打包体积成为主矛盾后，再评估 `Tauri`。
3. 2026-04-04：根据 review findings 补充 MVP contract gate：
   - `session bridge` 进入 MVP 前置条件，明确 desktop 必须预留 `start/send/append/resume/list/subscribe session` 入口。
   - `AgentProjectionPanelViewModel` 只能复用共享语义，实施前必须从 `apps/cli` 提取到 shared package，禁止 desktop 直接依赖 CLI 内部实现。
   - `Review / Artifact Pane` 改为依赖 service-owned artifact/review/transcript query contract，禁止通过 `.repo-ai-governor` 文件系统旁路。

## 9. 产出

1. `.repo-ai-governor/draft/desktop-surface-technical-selection-and-design.md`
