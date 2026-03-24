# checklist

- [x] TK-107 受控 delivery rehearsal 与 audit/replay 集成
  - 2026-03-24：任务创建，状态初始化为 `planned`。
  - 2026-03-24：任务启动，已完成首轮执行面勘察；当前仓库尚无现成的 delivery rehearsal runtime，需要基于现有 policy gate、audit recorder 与 replay/report builder 链路新增受控 delivery 实现。
  - 2026-03-24：已完成受控 `delivery_rehearsal` stage、artifact linkage、report/replay pointer 回链与 dry-run/allow 回归，并生成 `DA-107` 与 resolved review；当前任务状态更新为 `completed`。
- [x] TK-108 黑盒 E2E、CI/release gate 与 GA 指标收口
  - 2026-03-24：任务创建，状态初始化为 `planned`。
  - 2026-03-24：任务启动，已将 `DA-107` 固化为 blackbox/release/GA 的唯一 delivery 输入基线。
  - 2026-03-24：已完成 Stage 9 blackbox scenario matrix、GA metrics report、`gate:stage9-blackbox-ga` 接线、release unified gate supporting report 回链与 `DA-108` / resolved review；当前任务状态更新为 `completed`。
  - 2026-03-24：复核并修复 `code_review_tk-108-working-tree-follow-up-20260324-2029.md`；已补齐 `rollback rehearsal` 的 Stage 9 外部证据映射、unified gate 的 passed-status 校验和 `release-governance-spec.md` 同步，follow-up CR 已收尾为 `resolved`。
- [ ] TK-109 多 IDE surface registry 与 wrapper 契约强化
  - 2026-03-24：任务创建，状态初始化为 `planned`。
- [ ] TK-110 VS Code/JetBrains 官方模板与 smoke 门禁
  - 2026-03-24：任务创建，状态初始化为 `planned`。
- [ ] TK-111 Cursor/Claude Code 接入模板与文档一致性
  - 2026-03-24：任务创建，状态初始化为 `planned`。
- [ ] TK-112 project-010 出口验收与后续 rollout 输入约束
  - 2026-03-24：任务创建，状态初始化为 `planned`。
