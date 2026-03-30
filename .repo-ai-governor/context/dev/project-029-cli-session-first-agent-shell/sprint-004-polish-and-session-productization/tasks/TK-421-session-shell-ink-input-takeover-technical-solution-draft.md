# TK-421 session-shell Ink input takeover solution drafting record

- Status: completed
- Date: 2026-03-30
- Owner: AI-Agent
- Priority: P0
- Project: `project-029-cli-session-first-agent-shell`
- Sprint: `sprint-004-polish-and-session-productization`

## 1. 任务目标

产出并登记一份可评审的 Ink-owned input technical solution；方案正文固定落在 `.repo-ai-governor/draft/`，本任务文件只保留执行记录与方案入口回链。

## 2. Depends On

1. `TK-420`

## 3. 预期产物

1. `.repo-ai-governor/draft/session-shell-ink-input-takeover-technical-solution.md`
2. 与现有 session-shell contract 对齐的架构决策
3. 基于官方资料的外部参考结论

## 4. 实施计划

1. 复核现有 session-shell draft、contract 与 Ink-owned input proposal memo。
2. 基于官方 Ink / Ink UI / Ink Testing Library 文档形成正式 draft technical solution，并只写入 `.repo-ai-governor/draft/`。
3. 把本次 drafting 记录写回 active closeout sprint ledger。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. docs-only，本任务未修改可执行代码，因此 `build not required`

## 6. 执行记录

1. 2026-03-30：任务创建，状态初始化为 `planned`。
2. 2026-03-30：已完成 draft 正文 [session-shell-ink-input-takeover-technical-solution.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/draft/session-shell-ink-input-takeover-technical-solution.md)，明确 Ink 输入接管的组件边界、action model、迁移步骤、风险与验证建议，并补充官方参考链接。
3. 2026-03-30：本文件仅保留台账记录与 draft 入口，不再承载方案正文，避免在 `tasks/` 下形成第二份技术方案文本。
