# checklist

- [x] TK-136 project-013 启动与远端 provider 收口重排
  - 2026-03-25：任务创建，状态初始化为 `planned`。
  - 2026-03-25：已完成 `project-010` completed stream 归档、`project-013` project/sprint/task 骨架、`DA-136` 基线产物与 resolved review；当前任务状态更新为 `completed`。
  - 2026-03-25：已对齐 `DA-136` 的 canonical dependent task 推导关系，补齐 `TK-140/TK-141 -> DA-136` 依赖，并完成 reconcile + artifact lifecycle gate 复核。
- [x] TK-137 Codex 远端 provider 真实调用与凭据/health 契约
  - 2026-03-25：任务创建，状态初始化为 `planned`。
  - 2026-03-25：任务启动，已将 `DA-136` 固化为唯一基线输入；当前开始收敛 Codex 的凭据来源、health/deep probe 与真实 provider `probe/invoke` 执行面。
  - 2026-03-25：已完成第一轮实现，落下 `codex exec --json` real mode、真实健康探测与 CLI runtime fake-runner 注入，并按 review comment 拆出公开 constants/types。
  - 2026-03-25：已完成收口，补齐 `DA-137`、resolved review，并消除 `examples-runtime-smoke` / blackbox e2e / full gate 中的真实 Codex 调用泄漏。
  - 2026-03-25：已完成 follow-up CR 修复，fixture override 现要求显式 test gate 开关，`CLI_EXEC` cancellation matrix 已收紧并通过回归验证。
- [ ] TK-138 GitHub Copilot 远端 provider 真实调用与 capability truthfulness 收口
  - 2026-03-25：任务创建，状态初始化为 `planned`。
- [ ] TK-139 Claude Code 远端 provider 真实调用与 fallback/degrade 收口
  - 2026-03-25：任务创建，状态初始化为 `planned`。
- [ ] TK-140 跨 provider adapter 运维契约与 route-runner truthfulness hardening
  - 2026-03-25：任务创建，状态初始化为 `planned`。
- [ ] TK-141 sprint-001 出口验收与后续 rollout 输入约束
  - 2026-03-25：任务创建，状态初始化为 `planned`。
