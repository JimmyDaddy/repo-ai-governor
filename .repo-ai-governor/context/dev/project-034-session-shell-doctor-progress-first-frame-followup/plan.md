# project-034-session-shell-doctor-progress-first-frame-followup 计划

- Status: active
- Date: 2026-03-31
- Stage Mapping: Session-shell live progress follow-up hardening
- Phase Mapping: Activation and first-frame visibility fix / command recap presentation polish
- Upstream:
  - `.repo-ai-governor/context/dev/project-032-command-live-progress-react-shell-productization/plan.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`

## 1. 目标

1. 修复 session shell 中 direct bridge 命令在首帧上不显示 running progress 的可见性缺口。
2. 确保 `/doctor` 这类较快命令在 nested command body 真正运行前，用户就能看到 seeded running dock。
3. 为后续 closeout / commit 保留完整的任务、检查清单和执行记录。

## 2. Sprint 细化

## 2.1 sprint-001-doctor-progress-first-frame-fix

- Status: completed
- Sprint Goal: 修复 session shell 对快速 direct bridge 命令的 first-frame progress visibility，并补齐回归验证。
- Task Package: `TK-462`。

## 2.2 sprint-002-session-shell-command-recap-presentation-polish

- Status: completed
- Sprint Goal: 美化 session shell 中 Governor command recap 的呈现方式，让摘要、关键状态和 artifacts 不再以原始文本平铺。
- Task Package: `TK-463`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-462 | sprint-001 | render seeded running progress before direct bridge command execution blocks | cli/session-shell-ui | `.repo-ai-governor/context/dev/project-032-command-live-progress-react-shell-productization/plan.md` | completed |
| TK-463 | sprint-002 | improve session-shell command recap presentation and artifact formatting | cli/session-shell-ui | TK-462 | completed |

## 4. DoD（project-034）

1. session shell 在 direct bridge command seed running state 后立即 render 一帧，而不是等第一条 nested progress event 或 tick。
2. `/doctor` 这类命令即使没有及时发出 nested progress event，也能先显示 running progress dock。
3. 针对首帧可见性的回归测试已落地并通过。
4. Governor 的 `command_recap` transcript item 已升级为结构化 recap card，摘要/关键状态/artifacts/backlinks 的可读性明显提升。

## 5. 里程碑记录

1. 2026-03-31：创建 `project-034-session-shell-doctor-progress-first-frame-followup`，承接用户报告的 “doctor 命令没有进度显示” session-shell follow-up。
2. 2026-03-31：完成 `TK-462` 实现与验证；`CliSessionShellRunner` 现会在 `seedRunningState()` 后立即刷新 active surface，并新增 direct bridge seeded-progress regression coverage。
3. 2026-03-31：完成 `TK-463`；`command_recap` presenter 现以 recap card 渲染摘要、状态和 artifact 分区，并通过 `react-cli-runner` / `session-shell-runner` regression 与 `pnpm run build` 验证。
4. 2026-03-31：补齐 slash handoff recap metadata seam；`/doctor`、`/connect`、`/verify` 这类 `SESSION_MESSAGE_APPENDED` 成功结果现在会显式标记 `renderKind=command_recap`，不再回退成 plain-text transcript。
