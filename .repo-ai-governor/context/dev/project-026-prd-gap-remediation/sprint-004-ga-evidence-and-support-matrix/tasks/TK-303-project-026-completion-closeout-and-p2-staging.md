# TK-303 project-026 completion closeout 与 P2 staging 建议

- Status: completed
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P1
- Project: `project-026-prd-gap-remediation`
- Sprint: `sprint-004-ga-evidence-and-support-matrix`

## 1. 任务目标

完成 project-026 的 DoD 全项核查，执行项目级 closeout，并输出 P2 平台化阶段的 staging 建议。

## 2. Depends On

1. `TK-301`（支持矩阵已发布）
2. `TK-302`（GA 证据已沉淀）

## 3. 预期产物

1. project-026 完成态审计摘要文档
2. project-026 P2 staging 建议文档
3. project plan / sprint-004 plan 状态与里程碑记录同步
4. sprint-004 任务台账（checklist + tasks.csv + task cards）全部收口为 `completed`

## 4. DoD 核查项（来自 project plan §5）

| # | DoD 条目 | 验证方式 |
|---|---------|---------|
| 1 | PRD §10.2 #8 GA 硬阻断已关闭（通知 provider 已实装） | 引用 sprint-001 TK-292 rehearsal 通过记录 |
| 2 | Standards Pack 三视图端到端链路已验证闭环 | 引用 TK-293 + `standards-projection-parity.integration.test.ts` |
| 3 | i18n zh-CN/en 键集 parity 已通过 | 引用 TK-294 + `i18n-translation-key-coverage.integration.test.ts` |
| 4 | 至少 Python 和 Go 有最小治理模板 | 引用 TK-298 + `language-minimal-governance-packs.integration.test.ts` |
| 5 | 6 个 public 包 exports 声明已核查并补全 | 引用 TK-295 + `public-package-exports.integration.test.ts` |
| 6 | upgrade/workspace lifecycle adopter UX 已打磨 | 引用 TK-299 + `cli-output-contract.integration.test.ts` |
| 7 | 正式支持矩阵已发布 | 引用 TK-301 产物 `docs/support-matrix.md` |
| 8 | GA Readiness §10.2 全量量化证据已沉淀 | 引用 TK-302 产物 `docs/ga-readiness-evidence.md` |

## 5. Closeout 操作

1. 更新 project plan `plan.md` 状态为 `completed`
2. 更新 sprint-004 plan 状态为 `completed`
3. 更新 sprint-004 checklist 全部标记完成
4. 更新 tasks.csv 全部任务状态为 `completed`
5. `current-context.md` 保持 `project-026/sprint-004` 为 active closeout surface（符合 current-context.md `Update Rules` 第 4 条例外），待下一条主执行流显式激活后再迁移到 `completed-streams-history.md`
6. 将 closeout 决策与残余风险写入项目级完成态审计摘要

## 6. P2 Staging 建议范围

基于 `comprehensive-requirements-gap-analysis.md` §4.3 的 P2 远期缺口：

| Gap ID | 描述 | 建议优先序 | 启动条件 |
|--------|------|-----------|---------|
| GAP-DESKTOP | Desktop Client 实装 | P2-1 | 架构基线就绪（sidecar + IPC 已有） |
| GAP-VISUAL | 可视化配置与执行面板 | P2-2 | Desktop Client 基线完成 |
| GAP-CLOUD | 云端同步与策略分发 | P2-3 | 需产品化需求确认 |
| GAP-MARKET | 插槽市场/共享机制 | P2-4 | 需生态规模确认 |
| GAP-ORG | 组织级审计与指标看板 | P2-5 | 需企业客户需求驱动 |
| GAP-SLOT-DX | 插槽调试与测试工具链 | P2-附加 | 可并行推进 |

## 7. 验证命令

1. `pnpm run typecheck`
2. `pnpm run check`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 8. 执行记录

1. 2026-03-28：任务创建，状态初始化为 `planned`。
2. 2026-03-28：状态切换为 `in_progress`，完成 project-026 DoD 全项复核并起草 closeout 产物。
3. 2026-03-28：发布项目级收尾文档：
   - `.repo-ai-governor/context/dev/project-026-prd-gap-remediation/project-026-prd-gap-remediation-completion-audit-summary.md`
   - `.repo-ai-governor/context/dev/project-026-prd-gap-remediation/project-026-p2-staging-recommendations.md`
4. 2026-03-28：完成台账收口与验证，`TK-303` 状态切换为 `completed`；当前未迁移 `sprint-004` 到 completed history 的原因已按 closeout surface 例外规则记录。
5. 2026-03-28：补跑 `pnpm run check`，先后修复 `organizeImports` 漂移与 governance/example smoke 脚本的单引号解析兼容问题后，`check` 已恢复全绿。
6. 2026-03-28：补跑 `pnpm run test:coverage` 全量通过（92 files / 404 tests），GA Readiness 证据已同步更新为 `Pass 10 / Conditional pass 1 / Fail 0`。
