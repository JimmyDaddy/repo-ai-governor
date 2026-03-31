# sprint-002-session-shell-command-recap-presentation-polish 计划

- Status: completed
- Date: 2026-03-31
- Project: `project-034-session-shell-doctor-progress-first-frame-followup`
- Sprint Goal: 提升 session shell 中 Governor command recap 的结构化呈现质量，让摘要、关键状态与 artifacts 更易读。

## 1. Task Package

1. `TK-463` improve session-shell command recap presentation and artifact formatting

## 2. Exit Criteria

1. `command_recap` transcript item 改用结构化 recap card 呈现，而不是简单的文本行列表。
2. `摘要 / 关键状态 / artifact` 行能按语义拆分为更清晰的 sections。
3. 渲染回归测试与 build 通过。

## 3. Milestones

1. 2026-03-31：创建 `sprint-002`，承接用户对 Governor transcript 可读性的反馈。
2. 2026-03-31：完成 recap card presenter、渲染回归与 build 验证。
3. 2026-03-31：补齐 `SESSION_MESSAGE_APPENDED.metadata.renderKind` consumer seam，让 slash handoff 成功 recap 也能命中新 presenter。
