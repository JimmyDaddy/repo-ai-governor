# TK-086 project-009 出口验收与运营反馈闭环

- Status: completed
- Date: 2026-03-23
- Owner: AI-Agent
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
3. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
4. `pnpm run check`
5. `pnpm run release:ga-check`

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
   - 验收结果：通过
   - 验证证据：`DA-093`、`TK-081`、`pnpm run release:check`、`pnpm run release:verify-cleanroom-local-install --modes tgz --iterations 1`。
   - 备注：`dist` 运行时依赖镜像已收敛，clean-room `tgz` 安装可稳定执行。
2. 多工具/多模型真实调用与完整无人值守闭环
   - 验收结果：通过
   - 验证证据：`DA-094`、`TK-082`、`connect -> doctor --adapters -> verify --adapters` 集成测试与 `pnpm run check`。
   - 备注：已支持“同一工具绑定多个角色”，并收敛 `safe_local` 修复边界。
3. 角色级进度日志与人类友好交互
   - 验收结果：通过
   - 验证证据：`DA-095`、`TK-083`、`apps/cli` 集成测试（`cli-governance-runtime` / `cli-output-contract` / `cli-skeleton`）。
   - 备注：`role/stage/status` 与 `experience` 输出契约已统一并可回链审计。
4. 双黑盒主路径与持续 gate 收紧
   - 验收结果：通过
   - 验证证据：`DA-096`、`TK-084`、`test/e2e/blackbox-governance-flow.e2e.test.ts`、`pnpm run test:e2e`、`pnpm run test:contract`。
   - 备注：关键测试入口已移除 `passWithNoTests`，防止假阳性放行。
5. CI / 发布流水线生产化与 `release:ga-check`
   - 验收结果：通过
   - 验证证据：`DA-097`、`TK-085`、`.github/workflows/quality-gate.yml`、`.github/workflows/release-governance.yml`、`pnpm run check:stage9-handoff`、`pnpm run release:ga-check`。
   - 备注：`canary/rc/ga` 已接入真实 workflow，GA 失败信号可触发回滚演练并回链报告产物。
6. Stage 9A 基线持续复用
   - 验收结果：通过
   - 验证证据：`DA-092`、`DA-096`、`DA-097`、`scripts/ci/check-stage9-handoff-constraints.js` 与根级 `examples` smoke/runtime 门禁。
   - 备注：Stage 9A 交接约束已显式接线，未出现绕过 handoff 的发布或门禁路径。
7. project-009 总体验收结论
   - 结论：completed
   - 阻断项总数：0
   - 是否允许切换 project 状态为 `completed`：是
   - 结论说明：`TK-075`~`TK-086` 最新记录已收敛为 `20/20 completed`，`DA-092`~`DA-098` 证据链与门禁复跑结果满足 project-009 DoD。

## 8. 试点接入与 30 天运营反馈（DA-098 模板）

1. 试点仓库概览
   - 试点仓库 A：`/Users/jimmydaddy/study/ai-governor`（自托管主仓库）
   - 试点仓库 B：`/Users/jimmydaddy/study/playground`（clean-room 本地采用验证仓库）
   - 接入耗时与首次成功路径：首轮接入约 10~15 分钟，路径为 `--help -> init -> doctor -> check`。
2. 关键运营指标
   - `install -> init -> doctor -> check` 首次成功率：100%（`path/link` 各 3 次 + `tgz` 1 次，合计 7/7）。
   - 自动链路 rehearsal 通过率：100%（`plan -> run -> review -> review-verify -> replay` 黑盒链路与 `release:ga-check` 校验通过）。
   - 人工介入率：0%（本轮验收窗口未触发必须人工 confirm/escalate 的阻断项）。
   - 失败归因分布：本轮新增失败 0；历史发现已在 `TK-081`~`TK-085` 修复收敛。
3. SLO 与缺陷分级
   - SLO 指标：`check` 与 `release:ga-check` 双门禁保持可复跑通过；首次接入成功耗时目标维持 ≤ 15 分钟。
   - `P0/P1/P2` 缺陷分级与数量：`0/0/0`（截至 2026-03-23 当前验收窗口无未闭合缺陷）。
   - 当前未闭合风险：外部仓库长期样本仍需继续积累，作为 30 天运营观察项，不阻断 project-009 完成态。
4. 30 天闭环策略
   - fix-forward 节奏：按周收敛（每周汇总一次 gate 失败样本与外部接入反馈，必要时热修复）。
   - 版本策略：维持 `canary -> rc -> ga` 渐进发布，GA 前强制通过 `release:ga-check`。
   - owner 与时间窗口：`AI-Agent + 仓库维护者`；观察窗口 `2026-03-24` 至 `2026-04-23`。
5. 用户反馈摘要
   - 易用性反馈：`connect -> doctor --adapters -> verify --adapters` 主路径清晰，单工具多角色配置可直接上手。
   - 诊断/文档反馈：`local-adoption-playbook` 与 examples 可支持独立排障；role-level 进度与 `nextAction` 提示降低了问题定位成本。
   - 阻断性问题：无新增阻断项。

## 9. 后续输入约束与完成态审计交接（DA-098 模板）

1. 后续输入约束
   - next iteration / rollout 的统一入口：`DA-098` + `project-009-completion-audit-summary.md` + 主执行计划 Stage 9 后续 backlog。
   - 必须沿用的 gate 与基线：`pnpm run check`、`pnpm run release:ga-check`、`pnpm run check:stage9-handoff`、artifact/review/task-ledger 生命周期门禁。
   - 不得回退的能力边界：`adapters/routing` 必需配置、`doctor --fix` 仅 `safe_local`、`verify --adapters` 的 `pass/warn/fail`、`connect` 默认仅 diagnostics 写入。
2. completion audit summary 交接
   - 审计摘要路径：`.repo-ai-governor/context/dev/project-009-production-readiness/project-009-completion-audit-summary.md`
   - plan 里程碑回链状态：已完成（见 `project-009` 计划里程碑新增记录）。
   - 关键证据路径：`DA-092`、`DA-093`~`DA-098`、sprint-001/sprint-002 的 `plan/checklist/tasks.csv/review`、`artifact-registry` 主表与归档表。
3. 若 blocked
   - blocker 列表：不适用（当前结论为 `completed`）。
   - fix-forward owner/priority/window：不适用（转入 30 天运营观察清单，按周滚动收敛）。
   - 重新开启条件：若出现 `release:ga-check` 连续失败或新增 `P0` 阻断缺陷，则按变更窗口重开 project-009 补丁任务。

## 10. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：根据 `TK-093` 补齐 `DA-098` 模板骨架、completion audit summary 要求与 30 天运营反馈字段，任务状态保持 `planned`。
3. 2026-03-23：任务启动，状态切换为 `in_progress`，开始汇总 `DA-092`~`DA-097` 证据链、回填 `DA-098` 验收结论并准备项目完成态审计摘要。
4. 2026-03-23：任务完成，已回填 `DA-098` 全量验收/运营反馈字段，产出 `project-009-completion-audit-summary.md`，同步更新 project/sprint 计划与台账并通过全量门禁，状态切换为 `completed`。

## 11. 产出

1. `DA-098` `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/TK-086-project-009-exit-acceptance-and-operations-feedback-loop.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/tasks.csv`
4. `.repo-ai-governor/context/dev/project-009-production-readiness/project-009-completion-audit-summary.md`
5. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
6. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/plan.md`
7. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
