# TK-080 sprint-001 出口验收与 sprint-002 输入约束

- Status: planned
- Date: 2026-03-22
- Owner: TBD
- Priority: P0
- Project: `project-009-production-readiness`
- Sprint: `sprint-001-local-adoption-and-install-readiness`

## 1. 任务目标

汇总 sprint-001 输出证据，完成 Stage 9A 出口验收，并收敛 sprint-002 / Stage 9B 的唯一输入约束、风险清单与优先级。

## 2. Depends On

1. `TK-075`
2. `TK-076`
3. `TK-077`
4. `TK-078`
5. `TK-079`

## 3. 预期产物

1. `DA-092` sprint-001 出口验收与 sprint-002 输入约束产物文档。
2. 明确 Stage 9A `accept/block` 结论的验收记录。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`

## 5. 实施计划

1. 汇总 `DA-087`~`DA-091` 证据，并逐条对照 Stage 9A Hard Exit 与 GA Readiness 信号判断 `accept/block` 结论。
2. Stage 9A 验收必须显式覆盖：只读接入模式、两种安装模式 x 连续 3 次 clean-room 验证、至少 1 组 workspace 切换/rollback、根级 `examples/` 门禁、外部消费契约黑盒矩阵、最小支持矩阵与文档 readiness。
3. 输出 sprint-002 / Stage 9B 输入约束、风险分级、优先级建议、验证前置条件与未满足 blocker 的结构化归因，并显式纳入 `review -> review-verify -> report -> ledger backfill` 无人值守闭环、HITL 通知 rehearsal、受控 delivery rehearsal 与运营指标快照要求。
4. 将 `normative-loading-manifest`、code review lifecycle sync、Artifact Registry 生命周期治理等持续 gate 登记为 Stage 9B rehearsal 与 GA 候选的必查前置项。
5. 明确 `DA-092` 为 Stage 9B 唯一入口约束，并回链供 `TK-081`~`TK-086` 消费。
6. 同步更新 project/sprint 计划与台账状态基线。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`

## 6.1 `DA-092` 模板使用说明

1. 本任务卡本身即 `DA-092` 的承载入口；真正执行 sprint-001 出口验收时，应直接在下方第 7/8 节填入结论与证据，而不是另起一份平行文档。
2. 若某项未通过，必须写明：
   - `验收结果：阻断`
   - `阻断原因`
   - `阻断责任归类`（环境前置/策略闸口/权限确认/运行时缺陷/文档缺口）
   - `进入 Stage 9B 前的修复前置条件`
3. 若整体可进入 sprint-002，则第 7 节的总体验收结论必须写明 `accept`，并在第 8 节显式声明 `DA-092` 为 Stage 9B 唯一输入入口。
4. 所有证据应优先回链：
   - `DA-087`~`DA-091`
   - 相关任务卡与 review 生命周期文档
   - 对应 gate 命令输出与 artifact 路径

## 7. sprint-001 出口验收基线（DA-092 模板）

1. CLI 最小治理链路真实语义
   - 验收结果：待填写（通过/阻断）
   - 验证证据：待填写（建议回链 `DA-087`、`TK-075`、关键命令 smoke）
   - 备注：待填写
2. 只读接入模式与既有规范复用建议
   - 验收结果：待填写（通过/阻断）
   - 验证证据：待填写（建议回链 `DA-087`、`TK-075`、`TK-079`）
   - 备注：待填写
3. 本地安装模式 clean-room 验证
   - 验收结果：待填写（通过/阻断）
   - 验证证据：待填写（建议回链 `DA-089`、`TK-077`，并注明两种安装模式 x 连续 3 次结果）
   - 备注：待填写
4. workspace 切换与 rollback 保全
   - 验收结果：待填写（通过/阻断）
   - 验证证据：待填写（建议回链 `DA-089`、`TK-077`，并注明 `tool_managed -> repo_local -> rollback` 结果）
   - 备注：待填写
5. 调试/trace/replay 与失败归因基线
   - 验收结果：待填写（通过/阻断）
   - 验证证据：待填写（建议回链 `DA-088`、`TK-076`）
   - 备注：待填写
6. 根级 `examples/` 与 example smoke 阻断门禁
   - 验收结果：待填写（通过/阻断）
   - 验证证据：待填写（建议回链 `DA-090`、`TK-078`）
   - 备注：待填写
7. 用户接入文档与本地采用手册 readiness
   - 验收结果：待填写（通过/阻断）
   - 验证证据：待填写（建议回链 `DA-091`、`TK-079`、README/CHANGELOG）
   - 备注：待填写
8. 外部消费契约黑盒矩阵与最小支持矩阵
   - 验收结果：待填写（通过/阻断）
   - 验证证据：待填写（建议回链 `TK-077`、`TK-078`、安装验证记录、README 支持矩阵）
   - 备注：待填写
9. 持续 gate 与台账一致性
   - 验收结果：待填写（通过/阻断）
   - 验证证据：待填写（至少覆盖 `check-task-ledger-sync`、`check-sprint-plan-status-sync`、`normative-loading-manifest`、`check-code-review-status-sync`）
   - 备注：待填写
10. Stage 9A 总体验收结论
   - 结论：待填写（accept/block）
   - 阻断项总数：待填写
   - 进入 Stage 9B 条件：待填写
   - 结论说明：待填写

## 8. sprint-002 / Stage 9B 输入约束总览（DA-092 模板）

1. 统一输入入口
   - `DA-092` 是否作为唯一输入入口：待填写（是/否）
   - 若否，阻断原因：待填写
2. 实施优先级建议
   - 第一优先：待填写（建议 `TK-081`、`TK-082`）
   - 第二优先：待填写（建议 `TK-083`、`TK-084`）
   - 第三优先：待填写（建议 `TK-085`）
   - 收口任务：待填写（建议 `TK-086`）
3. 完整闭环与受控 delivery rehearsal 前置条件
   - `plan -> run -> review -> review-verify -> report -> ledger backfill` 的现状：待填写
   - `commit` / `PR draft` rehearsal 的现状：待填写
   - 当前缺口：待填写
   - 进入 rehearsal 前必须补齐项：待填写
4. 治理 gate 前置条件
   - `normative-loading-manifest`：待填写
   - code review lifecycle sync：待填写
   - Artifact Registry 生命周期治理：待填写
   - 其他必须常开 gate：待填写
5. HITL 通知 rehearsal 前置条件
   - 主通知渠道：待填写
   - 备用通知渠道：待填写
   - `confirm/escalate` 回执回链要求：待填写
6. 风险分级约束
   - `P0`：待填写
   - `P1`：待填写
   - 高风险动作的 `confirm/escalate` 要求：待填写
7. 试点与黑盒验证前置
   - 试点仓库选择条件：待填写
   - 黑盒路径最小覆盖：待填写
   - clean-room、`examples/`、外部消费契约矩阵与支持矩阵基线复用要求：待填写
8. 运营指标快照
   - 接入耗时：待填写
   - 规范违规率：待填写
   - 自动执行成功率 / 回滚率 / 人工介入率：待填写
   - 指标归档路径：待填写
9. 依赖产物与回链约束
   - 必须消费的上游产物：待填写（建议 `DA-087`~`DA-092`）
   - 回链要求：待填写（`artifact_id + artifact_path`、`tasks.csv/checklist/plan/review`）
10. 未满足 blocker 与 fix-forward 清单
   - blocker 列表：待填写
   - fix-forward owner/priority：待填写
   - 预期关闭窗口：待填写

## 9. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：根据 `TK-088` 将任务目标收紧为 Stage 9A 出口验收与 Stage 9B 唯一入口约束，任务状态保持 `planned`。
3. 2026-03-22：根据 `TK-090` 补齐只读接入/workspace rollback、完整 `review-verify` 闭环与治理 gate 的验收/交接口径，任务状态保持 `planned`。
4. 2026-03-22：根据 `TK-091` 补齐 `DA-092` 模板骨架，使任务卡可直接承载 Stage 9A 验收结论与 Stage 9B 输入约束。
5. 2026-03-22：根据 `TK-094` 补齐根级 `examples/`、外部消费契约/支持矩阵、HITL 通知 rehearsal、受控 delivery rehearsal 与运营指标快照口径，任务状态保持 `planned`。

## 10. 产出

1. `DA-092` `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-080-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/tasks.csv`
4. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
5. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/plan.md`
6. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/review/resolved_code_review_tk-091-tk-080-da-092-template-structure-hardening.md`
