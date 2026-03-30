# sprint-004-polish-and-session-productization 计划

- Status: completed
- Date: 2026-03-30
- Project: `project-029-cli-session-first-agent-shell`

## 1. Sprint Goal

完成剩余全部非-desktop CLI 能力收口，包括 session settings、`!` passthrough、`repo-ai-governor "query"` 初始 prompt 启动、多行/history/search、docs/help 收口与 desktop smoke baseline。

## 2. Task Package

1. `TK-413` session settings commands 与 deferred command naming 收口。
2. `TK-414` multiline / history / search UX 与 `!` passthrough / `"query"` 启动入口。
3. `TK-415` i18n / help / docs / adoption playbook 与全能力可发现性收口。
4. `TK-416` desktop sidecar smoke baseline 与 session DTO packaged-surface 校验。
5. `TK-417` stricter CR recheck 后的 `main.ts` session-shell entrypoint decomposition remediation。
6. `TK-418` completion / closeout / CR green-state build evidence governance 固化。
7. `TK-419` technical-solution delivery registry project-029 completion status sync。

## 3. Exit Criteria

1. 除 desktop presenter / 窗口层本体外，本技术方案约定的其余 CLI / runtime 功能已全部收口。
2. `!` shell passthrough、`repo-ai-governor "query"` 初始 prompt 启动、`/theme` 与 session routing setting command 已有正式实现或正式命名收口。
3. adopter-facing docs、help 和 playbook 已同步更新。
4. desktop smoke baseline 可验证 future presenter 不会被当前 CLI 实现卡死。

## 4. Execution Notes

1. 2026-03-30：已完成 `TK-413 ~ TK-416`，收口 `/theme`、`/agent`、multiline/history/search、`!` passthrough 与带引号首轮 prompt 启动入口。
2. 2026-03-30：README、`README.zh-CN.md`、`docs/local-adoption-playbook.md` 与 `docs/local-adoption-playbook.zh-CN.md` 已同步更新为 session-first shell 对外口径。
3. 2026-03-30：desktop sidecar smoke、session DTO packaged surface 与 project-level review/completion audit 已完成，`sprint-004` 进入 completed closeout state。
4. 2026-03-30：stricter CR recheck 将 `main.ts` 中 session-shell wiring 的 CS-027 note 升级为 actionable finding；同一修复窗口内已提取 `session-shell-entrypoint-runtime.ts`、补充入口测试，并把结果回写到同一份 `resolved` review。
5. 2026-03-30：新增 `TK-418`，将“代码变更下的完成/全绿默认必须包含同窗口真实 `pnpm run build`”固化到 `code_standards`、`long-term-maintenance-guide` 与 workspace CR workflow 文档，避免以后依赖口头记忆。
6. 2026-03-30：收尾 gate 发现 `technical-solution-delivery-registry` 中 project-029 的 follow-up delivery entry 仍停留在 `planned`；已通过 `TK-419` 将其与 completion audit / current-context closeout truth 同步回 `completed`。
