# TK-086 project-009 出口验收与运营反馈闭环

- Status: planned
- Date: 2026-03-22
- Owner: TBD
- Priority: P0
- Project: `project-009-production-readiness`
- Sprint: `sprint-002-automation-observability-and-ga-rollout`

## 1. 任务目标

完成 project-009 出口验收，并沉淀试点接入与 30 天运营反馈输入约束。

## 2. Depends On

1. `TK-081`
2. `TK-082`
3. `TK-083`
4. `TK-084`
5. `TK-085`

## 3. 预期产物

1. `DA-098` project-009 出口验收与运营反馈闭环产物文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/plan.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-080-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`（`DA-092`）
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
5. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 5. 实施计划

1. 默认消费 `DA-092` 作为 sprint-002 唯一 handoff 入口，确认 blocker/fix-forward、完整闭环前置与持续 gate 未被绕过。
2. 汇总 `DA-093`~`DA-097` 并完成 project-009 验收判定。
3. 沉淀试点仓库输入、问题分级、SLO 指标与 30 天运营反馈机制。
4. 生成 `project-009-completion-audit-summary.md`，并在 project 计划里程碑中完成回链。
5. 更新项目计划里程碑并生成后续 rollout / next-iteration 输入约束。
6. 回写台账并登记 `DA-098`。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`

## 6.1 `DA-098` 模板使用说明

1. 本任务卡本身即 `DA-098` 的承载入口；真正执行 project-009 收尾时，应直接在下方第 7/8/9 节填入结论、试点反馈与后续输入约束。
2. 若 project-009 达到完成态，必须同步产出：
   - `.repo-ai-governor/context/dev/project-009-production-readiness/project-009-completion-audit-summary.md`
   - `project-009` 计划中的新增里程碑回链
3. 若项目未达到完成态，第 7 节总体验收结论必须写明 `blocked`，并在第 9 节给出 fix-forward 约束，禁止将项目状态切换为 `completed`。
4. 证据优先回链：
   - `DA-092`
   - `DA-093`~`DA-097`
   - 对应任务卡/review 文档
   - gate 命令、试点记录、审计/产物路径

## 7. project-009 出口验收基线（DA-098 模板）

1. 发布分发模型与运行时可解析打包
   - 验收结果：待填写（通过/阻断）
   - 验证证据：待填写（建议回链 `DA-093`、`TK-081`）
   - 备注：待填写
2. 多工具/多模型真实调用与完整无人值守闭环
   - 验收结果：待填写（通过/阻断）
   - 验证证据：待填写（建议回链 `DA-094`、`TK-082`）
   - 备注：待填写
3. 角色级进度日志与人类友好交互
   - 验收结果：待填写（通过/阻断）
   - 验证证据：待填写（建议回链 `DA-095`、`TK-083`)
   - 备注：待填写
4. 双黑盒主路径与持续 gate 收紧
   - 验收结果：待填写（通过/阻断）
   - 验证证据：待填写（建议回链 `DA-096`、`TK-084`)
   - 备注：待填写
5. CI / 发布流水线生产化与 `release:ga-check`
   - 验收结果：待填写（通过/阻断）
   - 验证证据：待填写（建议回链 `DA-097`、`TK-085`)
   - 备注：待填写
6. Stage 9A 基线持续复用
   - 验收结果：待填写（通过/阻断）
   - 验证证据：待填写（建议回链 `DA-092`、clean-room/read-only attach/examples 复跑证据）
   - 备注：待填写
7. project-009 总体验收结论
   - 结论：待填写（completed/blocked）
   - 阻断项总数：待填写
   - 是否允许切换 project 状态为 `completed`：待填写（是/否）
   - 结论说明：待填写

## 8. 试点接入与 30 天运营反馈（DA-098 模板）

1. 试点仓库概览
   - 试点仓库 A：待填写
   - 试点仓库 B：待填写
   - 接入耗时与首次成功路径：待填写
2. 关键运营指标
   - `install -> init -> doctor -> check` 首次成功率：待填写
   - 自动链路 rehearsal 通过率：待填写
   - 人工介入率：待填写
   - 失败归因分布：待填写
3. SLO 与缺陷分级
   - SLO 指标：待填写
   - `P0/P1/P2` 缺陷分级与数量：待填写
   - 当前未闭合风险：待填写
4. 30 天闭环策略
   - fix-forward 节奏：待填写
   - 版本策略：待填写
   - owner 与时间窗口：待填写
5. 用户反馈摘要
   - 易用性反馈：待填写
   - 诊断/文档反馈：待填写
   - 阻断性问题：待填写

## 9. 后续输入约束与完成态审计交接（DA-098 模板）

1. 后续输入约束
   - next iteration / rollout 的统一入口：待填写
   - 必须沿用的 gate 与基线：待填写
   - 不得回退的能力边界：待填写
2. completion audit summary 交接
   - 审计摘要路径：待填写（建议 `project-009-completion-audit-summary.md`）
   - plan 里程碑回链状态：待填写
   - 关键证据路径：待填写
3. 若 blocked
   - blocker 列表：待填写
   - fix-forward owner/priority/window：待填写
   - 重新开启条件：待填写

## 10. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：根据 `TK-093` 补齐 `DA-098` 模板骨架、completion audit summary 要求与 30 天运营反馈字段，任务状态保持 `planned`。

## 11. 产出

1. `DA-098` `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/TK-086-project-009-exit-acceptance-and-operations-feedback-loop.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/tasks.csv`
4. `.repo-ai-governor/context/dev/project-009-production-readiness/project-009-completion-audit-summary.md`（收尾时产出）
5. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
6. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/plan.md`
7. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/review/resolved_code_review_tk-093-tk-086-da-098-template-and-completion-audit-entry-hardening.md`
