# checklist

- [x] TK-027 Slot Engine 双轨与脚本安全六项基线
  - 2026-03-20: 任务启动，状态切换为 `in_progress`，开始实现声明式/脚本双轨 slot 运行模型与安全六项约束。
  - 2026-03-20: 完成 `packages/slots` 基线模块与 `slot-engine-security` smoke 测试，补齐脚本安全六项契约与审计字段输出。
  - 2026-03-20: 通过 `pnpm run typecheck`、`pnpm run test -- slot-engine-security.smoke.test.ts`、`pnpm run check`，任务状态切换为 `completed`。
- [x] TK-028 Standards 升级 UX 与版本 pin 策略基线
  - 2026-03-20: 任务启动，状态切换为 `in_progress`，开始实现升级冲突分级、自动修复建议、回滚语义与版本 pin 策略。
  - 2026-03-20: 完成 `StandardsUpgradePlanner` 基线实现并补齐升级 UX smoke 覆盖（minor 自动升级、major 阻断、source 变更 confirm、非法 semver 报错）。
  - 2026-03-20: 通过 `pnpm run typecheck`、`pnpm run test -- standards-upgrade-ux.smoke.test.ts`、`pnpm run check`，任务状态切换为 `completed`。
- [x] TK-031 仓库本地 Code Review Workflow Skill
  - 2026-03-20: 任务启动，状态切换为 `in_progress`，开始创建 repo-local code review workflow skill，并将 CR 产物路由到当前 sprint `code-review/` 目录。
  - 2026-03-20: 完成 `.codex/skills/workspace-code-review-workflow`、`AGENTS.md` 本地技能入口映射与当前 sprint 台账同步。
  - 2026-03-20: 在临时 venv 中安装 `PyYAML` 后执行 `quick_validate.py`，并通过 `check-task-ledger-sync` 与 `check-sprint-plan-status-sync`，任务状态切换为 `completed`。
- [ ] TK-030 project-003 出口验收与 project-004 输入约束
