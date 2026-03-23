# TK-080 sprint-001 出口验收与 sprint-002 输入约束

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
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
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/run-normative-loading-manifest-gate.js`
5. `pnpm run check`

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
   - 验收结果：通过
   - 验证证据：`DA-087`（`TK-075`）、`resolved_code_review_tk-075-cli-command-deskeletonization-and-governance-chain.md`、`pnpm run help`/`pnpm run check` 通过记录。
   - 备注：`init/doctor/check` 已从 skeleton 输出收敛为可执行治理语义。
2. 只读接入模式与既有规范复用建议
   - 验收结果：通过
   - 验证证据：`DA-087`、`DA-089`（只读 attach 预检）、`README.md` 与 `README.zh-CN.md` 的只读接入说明。
   - 备注：`doctor` 在写权限受限场景返回只读语义，不因不可写直接失败。
3. 本地安装模式 clean-room 验证
   - 验收结果：通过
   - 验证证据：`DA-089`、`TK-077-cleanroom-validation-report.json`。
   - 备注：`path` 与 `link` 各连续 3 次通过 `--help -> init -> doctor -> check`；`tgz` 明确为 Stage 9B fix-forward。
4. workspace 切换与 rollback 保全
   - 验收结果：通过
   - 验证证据：`DA-089`、`TK-077` 执行记录。
   - 备注：已完成 `tool_managed -> repo_local -> rollback` 一组完整切换验证。
5. 调试/trace/replay 与失败归因基线
   - 验收结果：通过
   - 验证证据：`DA-088`、`TK-076`、`resolved_code_review_tk-076-local-debug-trace-replay-and-diagnostics-baseline.md`。
   - 备注：`run --dry-run --trace --replay` 与 `review -> review-verify -> ledger backfill` 归因链路已可回链。
6. 根级 `examples/` 与 example smoke 阻断门禁
   - 验收结果：通过
   - 验证证据：`DA-090`、`resolved_code_review_tk-078-examples-assets-and-example-smoke-gate-baseline.md`、`check:examples-doc-smoke`/`check:examples-runtime-smoke` 纳入 `pnpm run check`。
   - 备注：示例资产已从 README-only 收敛为 `scenario.json + fixtures + expected` 可执行结构。
7. 用户接入文档与本地采用手册 readiness
   - 验收结果：通过
   - 验证证据：`DA-091`、`README.md`、`README.zh-CN.md`、`CHANGELOG.md`、`CHANGELOG.zh-CN.md`、`docs/local-adoption-playbook*.md`。
   - 备注：文档链路已覆盖安装、调试、升级、回滚与排障入口。
8. 外部消费契约黑盒矩阵与最小支持矩阵
   - 验收结果：通过（Stage 9A 约束基线）
   - 验证证据：`.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`（Stage 9 外部消费契约矩阵/支持矩阵条款）、`project-009/plan.md` 对齐项、`DA-090`/`DA-091` 回链入口。
   - 备注：Stage 9A 已形成文档与门禁约束基线；Stage 9B 在 `TK-084`/`TK-085` 做黑盒与发布链路实测闭环。
9. 持续 gate 与台账一致性
   - 验收结果：通过
   - 验证证据：`check-task-ledger-sync`、`check-sprint-plan-status-sync`、`check-code-review-status-sync`、`run-normative-loading-manifest-gate`、`pnpm run check`。
   - 备注：`artifact/review/normative` 三类持续 gate 在 Stage 9A 结束时保持可复跑。
10. Stage 9A 总体验收结论
   - 结论：accept
   - 阻断项总数：0（Stage 9A hard-exit）
   - 进入 Stage 9B 条件：按第 8 节完成 `TK-081`~`TK-086`，并关闭 `tgz` 打包可执行性、HITL rehearsal、受控 delivery rehearsal、运营指标采样等 fix-forward 项。
   - 结论说明：Stage 9A 所要求的最小可安装、可调试、可治理与可文档化能力均达成，允许进入 sprint-002。

## 8. sprint-002 / Stage 9B 输入约束总览（DA-092 模板）

1. 统一输入入口
   - `DA-092` 是否作为唯一输入入口：是
   - 若否，阻断原因：不适用
2. 实施优先级建议
   - 第一优先：`TK-081`、`TK-082`（先收敛发布分发可执行性与无人值守完整链路）
   - 第二优先：`TK-083`、`TK-084`（再收敛角色观测与双黑盒门禁）
   - 第三优先：`TK-085`（CI/发布流水线生产化）
   - 收口任务：`TK-086`
3. 完整闭环与受控 delivery rehearsal 前置条件
   - `plan -> run -> review -> review-verify -> report -> ledger backfill` 的现状：命令与文档基线已具备，Stage 9B 需补齐“多工具真实调用 + 无人值守调度 + 受控输出”稳定性实测。
   - `commit` / `PR draft` rehearsal 的现状：边界已在主执行计划显式约束，尚未完成至少 1 条受控 rehearsal 实测。
   - 当前缺口：多工具路由稳定性、真实 HITL 回执链路、受控 delivery 实测证据。
   - 进入 rehearsal 前必须补齐项：先完成 `TK-081`（可执行打包）与 `TK-082`（无人值守闭环）。
4. 治理 gate 前置条件
   - `normative-loading-manifest`：维持 blocking 模式常开，不得降级绕过。
   - code review lifecycle sync：保持 `review -> verified -> resolved` 命名与 `Status` 同步。
   - Artifact Registry 生命周期治理：主表仅 `active/frozen/deprecated`；持续通过 lifecycle gate。
   - 其他必须常开 gate：`check-task-ledger-sync`、`check-sprint-plan-status-sync`、`check-code-review-status-sync`、`check:examples-smoke`、`check:examples-runtime-smoke`。
5. HITL 通知 rehearsal 前置条件
   - 主通知渠道：notification provider 主路由（建议 webhook/chat-im）。
   - 备用通知渠道：notification provider 备路由（建议 issue/email）。
   - `confirm/escalate` 回执回链要求：通知回执、人工决策与最终执行动作必须在 audit/replay 可检索并可关联 `execution_id`。
6. 风险分级约束
   - `P0`：发布产物不可执行、无人值守闭环断裂、黑盒 E2E 主路径失败、持续 gate 失效。
   - `P1`：角色级观测体验不完整、回执可读性不足、次要链路性能/稳定性波动。
   - 高风险动作的 `confirm/escalate` 要求：涉及依赖升级、CI/发布改动、写操作升级与潜在不可逆动作必须先命中人工确认闸口。
7. 试点与黑盒验证前置
   - 试点仓库选择条件：具备 read-only 与可写两类仓库样本；覆盖至少一个多角色协作场景。
   - 黑盒路径最小覆盖：`只读接入 -> init -> doctor -> check` 与 `plan -> run -> review -> review-verify -> report/replay`。
   - clean-room、`examples/`、外部消费契约矩阵与支持矩阵基线复用要求：不得重置 Stage 9A 基线，必须在 Stage 9A 已有资产上持续回归。
8. 运营指标快照
   - 接入耗时：以 5~15 分钟首次成功接入为 Stage 9A 基线目标。
   - 规范违规率：以 `pnpm run check` 持续通过为当前基线（异常即计入违规样本）。
   - 自动执行成功率 / 回滚率 / 人工介入率：Stage 9A 未形成稳定样本，需在 `TK-082`~`TK-086` 期间按试点连续采样。
   - 指标归档路径：先归档到 `TK-086`（`DA-098`）与 `project-009-completion-audit-summary.md`。
9. 依赖产物与回链约束
   - 必须消费的上游产物：`DA-087`、`DA-088`、`DA-089`、`DA-090`、`DA-091`、`DA-092`。
   - 回链要求：统一采用 `artifact_id + artifact_path`，并同步回写 `tasks.csv/checklist/plan/review/artifact-registry`。
10. 未满足 blocker 与 fix-forward 清单
   - blocker 列表：
     - B1：`tgz` clean-room 安装可执行性尚未达标（`TK-081`）。
     - B2：多工具真实调用与无人值守完整闭环尚未实测达标（`TK-082`）。
     - B3：主备通知渠道 `confirm/escalate` rehearsal 尚未形成回执证据（`TK-083`/`TK-084`）。
     - B4：受控 delivery rehearsal（`commit`/`PR draft`）尚未形成稳定证据（`TK-085`）。
     - B5：运营指标快照尚未完成 30 天采样沉淀（`TK-086`）。
   - fix-forward owner/priority：
     - B1/B2：AI-Agent，P0。
     - B3/B4：AI-Agent，P0。
     - B5：AI-Agent，P1（项目收口硬约束）。
   - 预期关闭窗口：sprint-002（`TK-081`~`TK-086`）全部关闭。

## 9. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：根据 `TK-088` 将任务目标收紧为 Stage 9A 出口验收与 Stage 9B 唯一入口约束，任务状态保持 `planned`。
3. 2026-03-22：根据 `TK-090` 补齐只读接入/workspace rollback、完整 `review-verify` 闭环与治理 gate 的验收/交接口径，任务状态保持 `planned`。
4. 2026-03-22：根据 `TK-091` 补齐 `DA-092` 模板骨架，使任务卡可直接承载 Stage 9A 验收结论与 Stage 9B 输入约束。
5. 2026-03-22：根据 `TK-094` 补齐根级 `examples/`、外部消费契约/支持矩阵、HITL 通知 rehearsal、受控 delivery rehearsal 与运营指标快照口径，任务状态保持 `planned`。
6. 2026-03-22：任务启动，状态切换为 `active`，完成 `DA-087`~`DA-091` 证据汇总、Stage 9A 验收判定与 Stage 9B 输入约束收敛。
7. 2026-03-22：完成 `DA-092` 回填与台账同步，补齐 review 与 artifact-registry，并通过 `check-task-ledger-sync`、`check-sprint-plan-status-sync`、`check-code-review-status-sync`、`run-normative-loading-manifest-gate`、`pnpm run check`，状态切换为 `completed`。

## 10. 产出

1. `DA-092` `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-080-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/tasks.csv`
4. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
5. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/plan.md`
6. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/review/resolved_code_review_tk-080-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
7. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
