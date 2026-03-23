# sprint-002-automation-observability-and-ga-rollout 计划

- Status: completed
- Date: 2026-03-23
- Project: `project-009-production-readiness`

## 1. Sprint Goal

完成 Stage 9 第二轮收敛：打通多工具/多模型自动执行闭环，并提供人类友好的角色进度日志与交互展示，同时收敛发布门禁生产化；并落实 `connect -> doctor --adapters -> verify --adapters` 接入主路径与 `adapters/routing` 配置收敛。

## 2. In-Scope Tasks

1. TK-081 发布分发模型与运行时可解析打包收敛（completed）
2. TK-082 多工具/多模型真实调用与无人值守自动链路（completed）
3. TK-083 角色级进度日志与人类友好交互展示（completed）
4. TK-084 黑盒 E2E 与门禁收紧基线（completed）
5. TK-085 CI 与发布流水线生产化接线（completed）
6. TK-086 project-009 出口验收与运营反馈闭环（completed）

## 3. Entry Criteria

1. `DA-092`（sprint-001 出口验收与 sprint-002 输入约束）可检索，且 Stage 9A 总体验收结论为 `accept`。
2. `DA-092` 中声明的 blocker 已清零或已有明确 fix-forward owner/priority/window，禁止绕过 handoff 约束直接推进 sprint-002。
3. 本地安装、只读接入、workspace rollback、调试与 examples 资产已形成可复用基线。
4. `release:ga-check` 与 `check` 在当前仓库保持可复跑。
5. `.repo-ai-governor/draft/multi-ai-tools-fast-onboarding-technical-solution.md` 的已采纳决策已作为 sprint-002 实施约束：
   - 阶段 A 直接引入 `adapters/routing` 必需配置；
   - `doctor --fix` 仅允许 `safe_local` 自动修复；
   - `verify --adapters` 使用 `pass/warn/fail` 稳定判定；
   - `connect` 默认仅写 diagnostics artifact。

## 4. Exit Criteria

1. 形成 `DA-093`~`DA-097` 五项实现产物与 `DA-098` 项目出口验收产物。
2. 多工具/多模型自动链路与角色级观测链路通过黑盒验证，并覆盖 `plan -> run -> review -> review-verify -> report -> ledger backfill`。
3. 黑盒与发布门禁持续复用 Stage 9A 的 read-only attach、clean-room 与 examples 基线，不得回退为仓库内自证。
4. `adapters/routing` 必需配置已落地并通过校验，且支持“单工具多角色”绑定模式。
5. `doctor --adapters --fix` 仅执行 `safe_local` 自动修复，高风险项均输出 `nextAction` 并保留人工执行边界。
6. `verify --adapters` 输出 `pass/warn/fail` 判定与角色绑定矩阵，且能回链诊断产物。
7. `connect` 默认仅写 diagnostics artifact，显式参数下才回写任务台账。
8. `DA-098` 明确包含试点接入复盘、30 天运营反馈、SLO/缺陷分级与后续输入约束。
9. 产出 `project-009-completion-audit-summary.md` 并在 project 计划里程碑中完成回链。
10. 项目级任务台账同步满足 `CS-021`。
